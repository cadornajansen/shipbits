-- Official homepages reviewed 2026-08-31. These are catalog candidates, not
-- partner/approval promises. Unknown account/fee requirements remain NULL.
-- Submission URLs are intentionally NULL where the current form was not verified.
-- Admin must check eligibility, current fees and terms before each manual submission.
insert into public.directories(name,slug,website_url,description,topics,priority) values
('AIxploria','aixploria','https://www.aixploria.com/en/','AI tools organized by use case.','{ai}',60),
('AlternativeTo','alternativeto','https://alternativeto.net/','Community software alternatives catalog.','{general,productivity}',80),
('BetaList','betalist','https://betalist.com/','Discovery platform for early-stage startups.','{startup}',80),
('DevHunt','devhunt','https://devhunt.org/','Launch platform focused on developer tools.','{developer}',90),
('Futurepedia','futurepedia','https://www.futurepedia.io/','AI software discovery directory.','{ai}',70),
('G2','g2','https://www.g2.com/','Business software profiles and reviews.','{saas}',70),
('GetApp','getapp','https://www.getapp.com/','Business application discovery and comparison.','{saas,productivity}',60),
('GoodFirms','goodfirms','https://www.goodfirms.co/','Business software and service provider directory.','{saas}',50),
('Insidr AI','insidr-ai','https://www.insidr.ai/ai-tools/','Curated AI tools catalog.','{ai}',50),
('Launching Next','launching-next','https://www.launchingnext.com/','Startup discovery and launch directory.','{startup}',70),
('Microlaunch','microlaunch','https://microlaunch.net/','Product launches from independent builders.','{startup,general}',80),
('OpenAlternative','openalternative','https://openalternative.co/','Open-source alternatives to popular software.','{open_source}',80),
('Open Source Alternative','open-source-alternative','https://opensourcealternative.to/','Open-source alternatives to proprietary software.','{open_source}',70),
('PitchWall','pitchwall','https://pitchwall.co/','Product discovery platform, formerly BetaPage.','{ai,startup}',60),
('Product Hunt','product-hunt','https://www.producthunt.com/','Technology product launch community.','{startup,general}',100),
('SaaSHub','saashub','https://www.saashub.com/','Software alternatives and startup discovery.','{general,saas}',90),
('SaaSworthy','saasworthy','https://www.saasworthy.com/','Business software discovery and comparison.','{saas}',60),
('SideProjectors','sideprojectors','https://www.sideprojectors.com/','Side-project showcase and marketplace; use showcase only when appropriate.','{startup}',40),
('SourceForge Software','sourceforge-software','https://sourceforge.net/software/','Business software comparison directory.','{general,saas}',70),
('StartupBlink','startupblink','https://www.startupblink.com/','Global startup ecosystem map, including Philippine startups.','{startup}',50),
('Startup Stash','startup-stash','https://startupstash.com/','Curated tools and resources for startups.','{general,productivity}',70),
('Toolify','toolify','https://www.toolify.ai/','AI tools and software catalog.','{ai}',60),
('ToolPilot','toolpilot','https://www.toolpilot.ai/','AI tool discovery directory.','{ai}',50),
('Uneed','uneed','https://www.uneed.best/','Product launches and discovery; check current paid submission requirements.','{general,startup}',80)
on conflict(slug) do update set name=excluded.name,website_url=excluded.website_url,
  description=excluded.description,topics=excluded.topics;
-- Do not overwrite operational flags, priority, submission URLs, or admin notes on rerun.
