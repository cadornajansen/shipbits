// Directional microfacet widths are inspired by Filament's anisotropic GGX model.
// Reference: https://google.github.io/filament/main/filament.html#materialsystem/anisotropicmodel
const titaniumFragmentShader = `#version 300 es
precision highp float;

uniform mediump vec2 u_resolution;
uniform float u_time;
uniform vec2 u_pointer;
uniform float u_shape;
uniform sampler2D u_mask;
uniform float u_quality;
uniform float u_brushDirection;
uniform float u_brushDensity;
uniform float u_finish;
uniform float u_anisotropy;
uniform float u_roughness;
uniform float u_scratchStrength;
uniform float u_bevelWidth;
uniform float u_bevelPolish;
uniform vec3 u_tint;
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

float filteredSine(float phase) {
  float width = max(fwidth(phase), .0001);
  return sin(phase) * max(0., sin(min(width * .5, PI)) / (width * .5));
}

float brushNoise(float across, float along, float density) {
  // Separate frequency bands keep machining legible without sampling subpixel scratches.
  float coarse = filteredSine(across * density * 1.05 + sin(along * 17.) * .16);
  float fine = filteredSine(across * density * 1.91 + sin(along * 41.) * .23);
  float finer = u_quality > .5 ? filteredSine(across * density * 4.3 + sin(along * 83.) * .29) : 0.;
  float bundles = filteredSine(across * density * .21 + sin(along * 5.) * .08);
  return coarse * .55 + fine * .23 + finer * .09 + bundles * .13;
}

float anisotropicLobe(vec3 normal, vec3 tangent, vec3 bitangent, vec3 h, float roughness, float anisotropy) {
  float axis = sqrt(max(.12, 1. - .88 * anisotropy));
  float ax = max(.045, roughness * roughness / axis);
  float ay = max(.035, roughness * roughness * axis);
  float hx = dot(tangent, h) / ax;
  float hy = dot(bitangent, h) / ay;
  float nh = max(dot(normal, h), .001);
  float denominator = hx * hx + hy * hy + nh * nh;
  return 1. / max(PI * ax * ay * denominator * denominator, .0001);
}

float studioReflection(vec3 reflection, vec2 grainDirection, float anisotropy, float roughness) {
  float projected = dot(reflection.xy, vec2(-grainDirection.y, grainDirection.x));
  float penumbra = mix(.012, .16, roughness);
  // Broad silver fill and narrow reflected softboxes keep the face metallic at rest.
  float band = 1. - smoothstep(.028, .028 + penumbra, abs(projected - .14));
  float second = 1. - smoothstep(.075, .075 + penumbra, abs(projected + .21));
  float darkBand = exp(-pow((projected - .015) / (.025 + roughness * .06), 2.));
  float isotropic = exp(-dot(reflection.xy - vec2(-.1, .12), reflection.xy - vec2(-.1, .12)) / .065);
  float directional = band * .67 + second * .2 - darkBand * .13;
  return .36 + .07 * (.5 + reflection.y * .5) + mix(isotropic * .57, directional, anisotropy);
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  float shortSide = min(u_resolution.x, u_resolution.y);
  float pixel = 1. / max(shortSide, 1.);
  vec2 p = (gl_FragCoord.xy - u_resolution * .5) / shortSide;
  vec2 extent = u_resolution / shortSide * .5 - .018;
  float distanceToEdge = shapeDistance(p, extent);
  float aa = max(fwidth(distanceToEdge), pixel);
  float alpha = 1. - smoothstep(-aa, aa, distanceToEdge);
  float bevelWidth = max(pixel, u_bevelWidth * .01);
  float bevel = u_bevelWidth > .001 ? 1. - smoothstep(0., bevelWidth, max(-distanceToEdge, 0.)) : 0.;
  vec2 edgeGradient = vec2(
    shapeDistance(p + vec2(pixel, 0.), extent) - shapeDistance(p - vec2(pixel, 0.), extent),
    shapeDistance(p + vec2(0., pixel), extent) - shapeDistance(p - vec2(0., pixel), extent)
  );
  edgeGradient /= max(length(edgeGradient), .00001);
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
    bevel = u_bevelWidth > .001 ? (1. - min(min(left, right), min(top, bottom))) * alpha : 0.;
  }

  float brushAngle = radians(u_brushDirection);
  vec2 q = rotate2d(-brushAngle) * p;
  vec2 grainDirection = vec2(cos(brushAngle), sin(brushAngle));
  float across = q.y;
  float along = q.x;
  if (u_finish > .5) {
    // A slightly offset lathe center keeps radial orientation meaningful as it rotates.
    vec2 radial = p - rotate2d(brushAngle) * vec2(.035, .0);
    grainDirection = normalize(vec2(-radial.y, radial.x) + vec2(.00001));
    across = length(radial);
    along = atan(radial.y, radial.x);
  }
  float scratches = brushNoise(across, along, u_brushDensity);
  float scratchStrength = u_scratchStrength * .01;
  vec2 crossDirection = vec2(-grainDirection.y, grainDirection.x);
  vec3 normal = normalize(vec3(p * .17 + edgeGradient * bevel * 1.5 + crossDirection * scratches * scratchStrength * .055, 1. - bevel * .28));
  vec3 tangent = normalize(vec3(grainDirection, -dot(grainDirection, normal.xy) / max(normal.z, .1)));
  vec3 bitangent = normalize(cross(normal, tangent));
  float lightAngle = radians(u_lightAngle) + sin(u_time * .4) * .3;
  float elevation = radians(u_lightElevation);
  vec3 lightPosition = vec3(cos(lightAngle) * cos(elevation), sin(lightAngle) * cos(elevation), sin(elevation)) * 2.1;
  lightPosition.xy += u_pointer * u_pointerInfluence * .011;
  vec3 light = normalize(lightPosition - vec3(p * .7, 0.));
  vec3 view = normalize(vec3(-p * .3 + u_pointer * u_pointerInfluence * .001, 2.));
  vec3 h = normalize(view + light);
  float roughness = clamp(u_roughness * .01, .04, 1.);
  float anisotropy = u_anisotropy * .01;
  float polish = u_bevelPolish * .01;
  float edgeRoughness = mix(roughness, mix(.5, .055, polish), bevel);
  vec3 reflection = reflect(-view, normal);
  // The studio light moves with the controls; a fixed environment would make a flat face look frozen.
  vec3 studioRay = reflection;
  studioRay.xy -= light.xy * .65;
  float reflectedStudio = studioReflection(studioRay, grainDirection, anisotropy, edgeRoughness);
  float ndl = max(dot(normal, light), 0.);
  float ndv = max(dot(normal, view), .01);
  float lobe = anisotropicLobe(normal, tangent, bitangent, h, edgeRoughness, anisotropy * (1. - bevel));
  // Tone compression preserves fine specular detail instead of clipping the entire highlight.
  float specular = lobe / (1. + lobe * 1.6) * ndl;
  float fresnel = pow(1. - ndv, 5.);
  vec3 color = u_tint * (reflectedStudio * (.58 + .42 * ndl) + .28 * specular);
  color += vec3(bevel * (.045 + .3 * polish * max(dot(edgeGradient, light.xy), 0.)));
  float grainVisibility = (1. - bevel * .8) * (.55 + .45 * ndl);
  color *= 1. + scratches * scratchStrength * .24 * grainVisibility;
  float grain = hash21(floor(p * min(shortSide, 1100.))) - .5;
  color += vec3(grain * scratchStrength * .025 + fresnel * .16);
  color *= max(u_lightIntensity * .01, 0.);
  fragColor = vec4(clamp(color, 0., 1.) * alpha, alpha);
}
`

export default titaniumFragmentShader
