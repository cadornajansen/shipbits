// Grating orders follow lambda = spacing * |dot(L + V, T)| / order.
// Reference: developer.nvidia.com/gpugems/gpugems/part-i-natural-effects/chapter-8-simulating-diffraction
const foilFragmentShader = `#version 300 es
precision highp float;

uniform mediump vec2 u_resolution;
uniform float u_time;
uniform vec2 u_pointer;
uniform float u_shape;
uniform sampler2D u_mask;
uniform float u_quality;
uniform float u_grooveSpacing;
uniform float u_grooveRotation;
uniform float u_pattern;
uniform float u_spectralStrength;
uniform float u_embossDepth;
uniform float u_roughness;
uniform float u_micrograin;
uniform float u_bevel;
uniform vec3 u_baseTint;
uniform float u_lightAngle;
uniform float u_lightElevation;
uniform float u_lightIntensity;
uniform float u_pointerInfluence;
out vec4 fragColor;

const float PI = 3.14159265359;

mat2 rotate2d(float a) {
  float c = cos(a), s = sin(a);
  return mat2(c, s, -s, c);
}

float hash21(vec2 p) {
  vec3 q = fract(vec3(p.xyx) * .1031);
  q += dot(q, q.yzx + 33.33);
  return fract((q.x + q.y) * q.z);
}

float shapeDistance(vec2 p, vec2 extent) {
  if (u_shape > .5 && u_shape < 1.5) return length(p) - .47;
  if (u_shape > 3.5) return (abs(p.x) + abs(p.y) - .46) * .70710678;
  float radius = u_shape > 1.5 && u_shape < 2.5 ? min(extent.x, extent.y) : .075;
  radius = min(radius, min(extent.x, extent.y));
  vec2 q = abs(p) - extent + radius;
  return min(max(q.x, q.y), 0.) + length(max(q, 0.)) - radius;
}

float stableWave(float phase) {
  // Integrate a sinusoid over the pixel footprint instead of aliasing fine lines.
  float footprint = max(fwidth(phase), .0001);
  float attenuation = sin(min(footprint * .5, PI)) / (footprint * .5);
  return sin(phase) * max(attenuation, 0.);
}

vec3 wavelengthRgb(float wavelength) {
  vec3 distanceToPrimary = (vec3(wavelength) - vec3(.625, .535, .445)) / vec3(.055, .045, .038);
  vec3 spectral = exp(-.5 * distanceToPrimary * distanceToPrimary);
  // Violet has a small red response; no arbitrary animated hue palette is used.
  spectral.r += .24 * exp(-pow((wavelength - .405) / .027, 2.));
  return spectral * smoothstep(.365, .4, wavelength) * (1. - smoothstep(.7, .76, wavelength));
}

vec3 diffraction(vec3 light, vec3 view, vec3 tangent, float spacing) {
  float opticalPath = spacing * abs(dot(light + view, tangent));
  vec3 color = vec3(0.);
  for (int order = 1; order <= 5; order++) {
    if (order > 3 && u_quality < .5) break;
    float n = float(order);
    color += wavelengthRgb(opticalPath / n) / pow(n, .85);
  }
  return color;
}

vec3 environment(vec3 r, float roughness) {
  float horizon = .5 + .5 * r.y;
  float axis = r.x + r.y * .45;
  float penumbra = mix(.012, .14, roughness);
  // Rectangular studio cards give foil a crisp metal reflection rather than a blurred sheen.
  float key = 1. - smoothstep(.055, .055 + penumbra, abs(axis - .06));
  float fill = 1. - smoothstep(.18, .18 + penumbra * 2., abs(axis + .38));
  float darkStrip = exp(-pow((axis + .13) / (.025 + roughness * .08), 2.));
  return vec3(.23 + .12 * horizon + .62 * key + .15 * fill - .11 * darkStrip);
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  float shortSide = min(u_resolution.x, u_resolution.y);
  float pixel = 1. / max(shortSide, 1.);
  vec2 p = (gl_FragCoord.xy - u_resolution * .5) / shortSide;
  vec2 extent = u_resolution / shortSide * .5 - .018;
  float distanceToEdge = shapeDistance(p, extent);
  float edgeWidth = max(fwidth(distanceToEdge), pixel);
  float alpha = 1. - smoothstep(-edgeWidth, edgeWidth, distanceToEdge);
  vec2 edgeGradient = vec2(
    shapeDistance(p + vec2(pixel, 0.), extent) - shapeDistance(p - vec2(pixel, 0.), extent),
    shapeDistance(p + vec2(0., pixel), extent) - shapeDistance(p - vec2(0., pixel), extent)
  );
  edgeGradient /= max(length(edgeGradient), .00001);
  float bevelWidth = max(pixel, u_bevel * .01);
  float bevel = u_bevel > .001 ? 1. - smoothstep(0., bevelWidth, max(-distanceToEdge, 0.)) : 0.;
  if (u_shape > 2.5 && u_shape < 3.5) {
    vec2 maskUv = vec2(uv.x, 1. - uv.y);
    alpha = texture(u_mask, maskUv).a;
    vec2 delta = vec2(bevelWidth * shortSide) / u_resolution;
    float left = texture(u_mask, maskUv - vec2(delta.x, 0.)).a;
    float right = texture(u_mask, maskUv + vec2(delta.x, 0.)).a;
    float top = texture(u_mask, maskUv - vec2(0., delta.y)).a;
    float bottom = texture(u_mask, maskUv + vec2(0., delta.y)).a;
    edgeGradient = vec2(left - right, bottom - top);
    edgeGradient /= max(length(edgeGradient), .00001);
    bevel = u_bevel > .001 ? (1. - min(min(left, right), min(top, bottom))) * alpha : 0.;
  }

  float angle = radians(u_grooveRotation);
  vec2 q = rotate2d(-angle) * p;
  float emboss = u_embossDepth * .01;
  vec2 grooveDirection = vec2(cos(angle), sin(angle));
  float grooveCoordinate = q.y;
  if (u_pattern > .5 && u_pattern < 1.5) {
    vec2 radialOrigin = vec2(.13 * cos(angle), .13 * sin(angle));
    vec2 radial = p - radialOrigin;
    grooveDirection = normalize(vec2(-radial.y, radial.x) + vec2(.00001));
    grooveCoordinate = length(radial);
  }
  float engravingPhase = (q.y + .11 * sin(q.x * 6.) + .035 * sin(q.x * 14.)) * 175.;
  if (u_pattern > .5 && u_pattern < 1.5) {
    float polarAngle = atan(q.y, q.x);
    engravingPhase = (length(q) + .025 * cos(polarAngle * 12.)) * 220.;
  }
  float engraving = stableWave(engravingPhase);
  float engravingCounter = stableWave((q.x + .065 * sin(q.y * 9.)) * 190.);
  float detailFootprint = max(fwidth(engravingPhase), .001);
  float resolvedDetail = 1. - smoothstep(1.8, 4., detailFootprint);
  // Microscopic engraved slopes are fixed to the foil; only their illumination moves.
  vec2 relief = vec2(.66 * cos(q.x * 6.) + .49 * cos(q.x * 14.), 1.) * engraving;
  vec2 etchedSlope = rotate2d(angle) * relief * emboss * .025 * resolvedDetail;
  vec3 normal = normalize(vec3(p * .09 + etchedSlope + edgeGradient * bevel * .9, 1. - bevel * .32));
  vec3 tangent = normalize(vec3(grooveDirection, -dot(grooveDirection, normal.xy) / max(normal.z, .1)));
  vec3 bitangent = normalize(cross(normal, tangent));
  float rotation = radians(u_lightAngle) + sin(u_time * .42) * .36;
  float elevation = radians(u_lightElevation);
  vec3 lightPosition = vec3(cos(rotation) * cos(elevation), sin(rotation) * cos(elevation), sin(elevation)) * 2.2;
  lightPosition.xy += u_pointer * u_pointerInfluence * .012;
  vec3 light = normalize(lightPosition - vec3(p * .65, 0.));
  vec3 view = normalize(vec3(-p * .26 + u_pointer * u_pointerInfluence * .001, 2.));
  vec3 halfVector = normalize(light + view);
  float roughness = clamp(u_roughness * .01, .025, 1.);
  float ndl = max(dot(normal, light), 0.);
  float ndv = max(dot(normal, view), .01);
  float ndh = max(dot(normal, halfVector), .01);
  float along = dot(halfVector, tangent) / mix(.11, .48, roughness);
  float across = dot(halfVector, bitangent) / mix(.24, .68, roughness);
  float highlight = exp(-(along * along + across * across) / (ndh * ndh));
  vec3 reflection = reflect(-view, normal);
  vec3 studioRay = reflection;
  studioRay.xy -= light.xy * .3;
  vec3 silver = environment(studioRay, roughness) * u_baseTint;
  silver *= .65 + ndl * .35;

  vec3 spectrum = diffraction(light, view, tangent, u_grooveSpacing);
  if (u_pattern > 1.5) {
    spectrum = (spectrum + diffraction(light, view, bitangent, u_grooveSpacing * .91)) * .63;
    grooveCoordinate += q.x * .28;
  }
  float rainbow = u_spectralStrength * .01;
  float studioAxis = studioRay.x + studioRay.y * .45;
  float spectralBand = exp(-pow((abs(studioAxis - .06) - .085) / (.026 + roughness * .075), 2.));
  // Colored diffraction is concentrated at the light's edges; the body remains silver.
  vec3 color = silver + spectrum * rainbow * (.07 + spectralBand * .8) * (1. - roughness * .6);
  color += vec3(highlight * mix(.16, .07, roughness));

  // Visible bundled grooves sit below the pixel limit; finer physical grooves drive diffraction above.
  float groovePhase = grooveCoordinate * 730. / max(u_grooveSpacing, .35);
  float engravedLines = stableWave(groovePhase);
  float fineLines = stableWave(groovePhase * 2.7);
  float ornamentalLines = u_pattern > 1.5 ? (engraving + engravingCounter) * .65 : engraving;
  float grain = hash21(floor(p * min(shortSide, 1100.))) - .5;
  color *= 1. + engravedLines * .065 + fineLines * .018 + ornamentalLines * emboss * .16;
  color += grain * u_micrograin * .0008;
  float fresnel = pow(1. - ndv, 5.);
  color += (.055 + .16 * max(dot(normal.xy, light.xy), 0.)) * bevel + fresnel * .1;
  color *= max(u_lightIntensity * .01, 0.);
  // Premultiplied output avoids dark fringes around antialiased masks.
  fragColor = vec4(clamp(color, 0., 1.) * alpha, alpha);
}
`

export default foilFragmentShader
