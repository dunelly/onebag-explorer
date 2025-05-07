import fs from 'fs';
import path from 'path';

const analysisDir = path.join('src', 'data', 'analysis');

// Parsed Pros/Cons data from user input
// NOTE: This requires careful mapping between the user's text and the actual 'name' field in the analysis JSON files.
// Fallbacks are used for general categories/brands where specific models aren't listed.
const prosConsData = {
  // --- Tactical/Military Category ---
  _tacticalGeneral: {
    pros: [
      "Typically very durable construction (Cordura, heavy stitching).",
      "High degree of organization, often with admin panels.",
      "MOLLE/PALS webbing for external modularity and customization.",
      "Often hydration bladder compatible.",
      "Good load-bearing capability (especially larger models).",
      "Clamshell or wide opening for easy access."
    ],
    cons: [
      "Can be heavy even when empty.",
      "Tactical aesthetic isn't suitable for all environments (e.g., formal office).",
      "Organization can sometimes feel overly complex or specific.",
      "Back panel ventilation might be less advanced than hiking packs.",
      "Comfort might prioritize load bearing over plush padding for some models."
    ]
  },
  // --- Aer ---
  _aerGeneral: {
    pros: [
      "Sleek urban/minimalist aesthetic",
      "Excellent build quality (Cordura ballistic nylon common)",
      "Fantastic organization tailored for tech/EDC/travel",
      "Comfortable straps/back panel",
      "Thoughtful features (luggage pass-through, quick access pockets)"
    ],
    cons: [
      "Can be relatively expensive",
      "Sometimes heavier due to materials/features",
      "Specific aesthetic might not appeal to everyone"
    ]
  },
  "Aer City Pack Pro": { // Assuming this maps from user's "City Pack Pro" under Aer
     pros: ["Great for EDC/work", "Professional look", "Stands upright", "Well-padded laptop compartment", "Smart organization"],
     cons: ["Capacity might be limiting for more than daily essentials", "Price"]
  },
  "Aer Flight Pack 3": {
    pros: ["Highly versatile (backpack, shoulder, briefcase carry)", "Great for short trips/work travel", "Meets personal item size for many airlines"],
    cons: ["Might be too small for longer trips", "Switching carry modes takes a moment"]
  },
  "Aer Travel Pack 3 Small": { // Might need to check exact name in JSON
    pros: ["Excellent one-bag travel option (often carry-on compliant internationally)", "Clamshell opening", "Load lifters", "Stowable straps"],
    cons: ["Can get heavy when fully packed", "Reduced capacity compared to full size"]
  },
  "Aer Travel Pack 3 X-Pac": { // Might need to check exact name in JSON
    pros: ["Lighter, more weather resistant than standard Cordura version", "High-tech look"],
    cons: ["More expensive", "X-Pac sound/feel isn't for everyone"]
  },
   "Aer Go Sling Pro": { // Name collision with Alpaka? Assuming Aer based on list order
    pros: ["Well-organized larger sling for EDC/tech", "Comfortable cross-body carry", "Durable"],
    cons: ["Too large for minimalist sling users", "Might feel bulky on smaller frames"]
  },
  // --- Able Carry ---
  _ableCarryGeneral: {
    pros: ["Robust construction (often X-Pac or Cordura)", "Unique A-frame structure helps bag stand and retain shape", "Comfortable harness", "Clean aesthetic", "Good water resistance"],
    cons: ["Can be relatively heavy for their size", "Organization might be less granular than Aer for some", "Potentially higher price point"]
  },
  "Able Carry Daily Backpack": { // Check exact name
     pros: ["Great all-around EDC size", "Durable", "Comfortable carry", "Unique look"],
     cons: ["Internal organization might be simpler than competitors"]
  },
   "Able Carry Max Backpack": { // Check exact name
     pros: ["Significant capacity for travel or large loads", "Very robust build", "Comfortable harness system for the load"],
     cons: ["Large and potentially heavy for daily use", "Price"]
   },
  // --- Alpaka ---
  "Alpaka Elements Backpack Pro": { // Check exact name
     pros: ["Highly organized for tech/EDC", "Weather resistant", "Comfortable carry", "Professional look"],
     cons: ["Can be complex with many pockets", "Price point"]
  },
   "Alpaka Go Sling Pro": { // Name collision with Aer? Assuming Alpaka here
     pros: ["Compact yet organized sling", "Good for essentials + small tablet/reader", "Premium feel"],
     cons: ["Limited capacity", "Sling style isn't for everyone"]
   },
  // --- Alpha One Niner ---
  "Alpha One Niner Whitley": { // Check exact name
    pros: ["Robust build quality (often using high-end Cordura)", "Thoughtful organization geared towards EDC/travel", "Comfortable harness system", "Often praised for practicality and durability", "Clamshell/lay-flat opening"],
    cons: ["Can be relatively heavy", "Design aesthetic is functional/slightly tactical", "May be harder to acquire than mainstream brands", "Can be expensive"]
  },
  // --- Arc'teryx ---
  _arcteryxGeneral: {
     pros: ["Exceptional build quality and materials (often weatherproof AC² construction)", "Sleek minimalist/technical aesthetic", "Comfortable carry systems", "High weather resistance"],
     cons: ["Premium price point", "Organization can be minimalist", "Specific aesthetic"]
  },
  "Arc'teryx Granville 16": { // Check name
     pros: ["Highly weather resistant (taped seams often)", "Clean look suitable for urban/commute", "Durable", "Comfortable straps"],
     cons: ["Top flap access might be less convenient than zippers for some", "Internal organization often simple", "Expensive"]
  },
  "Arc'teryx Granville 25": { // Check name
     pros: ["Highly weather resistant (taped seams often)", "Clean look suitable for urban/commute", "Durable", "Comfortable straps", "More capacity than 16L"],
     cons: ["Top flap access might be less convenient than zippers for some", "Internal organization often simple", "Expensive"]
  },
  // --- Bellroy ---
  _bellroyGeneral: {
    pros: ["Focus on slim profiles", "Clever organization", "Premium materials (often including eco-tanned leather accents, unique woven fabrics)", "Minimalist and professional aesthetics", "Lightweight options available (Lite range)"],
    cons: ["Can be expensive", "Slimness sometimes limits capacity or ability to carry bulky items", "Lighter materials on 'Lite' range may be less durable than heavy Cordura", "Some unique organizational features might not suit everyone"]
  },
  "Bellroy Apex Backpack": { // Check name
    pros: ["Innovative adjustable capacity/access design", "Premium materials", "Unique look", "Comfortable"],
    cons: ["Very expensive", "Unconventional design might take getting used to"]
  },
  "Bellroy Classic Backpack Plus": { // Check name
    pros: ["Versatile EDC size", "Good internal organization", "Professional look", "Comfortable"],
    cons: ["Capacity might feel tight for some 'Plus' size expectations"]
  },
  "Bellroy Lite Daypack": { // Check name
    pros: ["Very lightweight", "Packable (can often be folded/rolled)", "Made from recycled materials", "Good for casual use or as a secondary travel bag"],
    cons: ["Less structure than other Bellroy bags", "Materials feel less robust (by design)", "Minimal padding/support"]
  },
  "Bellroy Lite Travel Backpack 30L": { // Check name (and 38L version)
     pros: ["Very lightweight", "Packable", "Made from recycled materials", "Good for casual use or as a secondary travel bag"],
     cons: ["Less structure", "Materials feel less robust", "Minimal padding/support"]
  },
  "Bellroy Studio Backpack": { // Check name
    pros: ["Ultra-minimalist and slim", "Professional", "Magnetic Fidlock closure"],
    cons: ["Very limited capacity and organization", "Minimal padding"]
  },
  "Bellroy Tokyo Totepack": { // Check name
    pros: ["Versatile tote/backpack carry", "Slim profile", "Good internal organization for size"],
    cons: ["Backpack straps might be less comfortable for long carries than dedicated packs", "Tote mode less secure"]
  },
  "Bellroy Transit Backpack 28L": { // Check name (and Plus version)
     pros: ["Excellent travel/work bags", "Lay-flat main compartment access", "Separate laptop section", "External quick-access pockets", "Comfortable harness"],
     cons: ["Pricey", "Structure means they don't pack flat when empty"]
  },
  "Bellroy Transit Workpack 20L": { // Check name
     pros: ["Smaller version of Transit", "Great for EDC/commute", "Maintains good organization and separate laptop access"],
     cons: ["Limited capacity for anything beyond work essentials"]
  },
  "Bellroy Venture Backpack": { // Check name
     pros: ["More rugged/outdoor-inspired design", "Water-resistant zippers/materials", "Comfortable harness", "Good capacity"],
     cons: ["Aesthetic may be less formal than other Bellroy lines"]
  },
   "Bellroy Weekender 35L": { // Check name (and Plus version)
     pros: ["Duffel-style bag with backpack straps", "Large capacity for short trips", "Wide opening", "Organized pockets"],
     cons: ["Duffel carry might be primary, backpack straps secondary in comfort", "Can get bulky"]
   },
  // --- Black Diamond ---
  _blackDiamondGeneral: {
     pros: ["Focus on climbing/outdoor durability", "Robust materials", "Functional designs", "Comfortable carry systems geared towards activity"],
     cons: ["Aesthetic is typically outdoor/technical", "Organization might be simpler than EDC-focused bags"]
  },
   "Black Diamond Creek 20": { // Check name (assuming Diamond Creek 20)
     pros: ["Extremely durable (haul bag inspired)", "Stands upright", "Top-loader access often", "Simple and tough"],
     cons: ["Access might be limited", "Minimal internal organization", "Potentially heavier"]
   },
   "Black Diamond Stonehauler 30": { // Check name (and 45 version)
     pros: ["Highly durable and weather-resistant duffel bags with backpack straps", "Padded construction protects contents", "Multiple carry options"],
     cons: ["Primarily a duffel, backpack carry is functional but maybe less comfy than dedicated packs for long distances", "Bulky"]
   },
  // --- Chrome Industries ---
   _chromeGeneral: {
    pros: ["Extremely durable", "Often fully waterproof (roll-tops)", "Designed for urban cycling/commuting", "Distinctive industrial aesthetic", "Lifetime warranty often"],
    cons: ["Can be heavy", "Harness systems prioritize stability over plush comfort sometimes", "Aesthetic is rugged and not for everyone", "Organization can be basic in main compartments"]
  },
  "Chrome Industries Barrage Cargo": { // Check name
     pros: ["Waterproof roll-top main compartment", "External cargo net for bulky items", "Very durable"],
     cons: ["Limited internal organization", "Roll-top access isn't quick", "Heavy"]
  },
  "Chrome Industries Urban Ex 20L": { // Check name
     pros: ["Fully waterproof construction (welded seams)", "Lightweight for a waterproof bag", "Simple and durable"],
     cons: ["Minimal organization", "Roll-top access"]
   },
   "Chrome Industries Vega 25": { // Check name
      pros: ["Likely durable", "Good capacity for commute/short trips", "Potentially better organization than basic roll-tops"],
      cons: ["Weight", "Specific Chrome aesthetic"]
   },
  // --- Cote&Ciel ---
   _coteCielGeneral: {
    pros: ["Highly unique, architectural/avant-garde designs", "Premium materials", "Focus on protecting devices", "Make a strong style statement"],
    cons: ["Very expensive", "Unconventional shapes/access can impact practicality and capacity", "Designs are polarizing", "Comfort might be secondary to form"]
  },
   "Cote & Ciel Isar Large": { // Check name
     pros: ["Iconic design", "Excellent laptop protection", "Expands surprisingly", "High quality materials"],
     cons: ["Unusual access", "Shape makes packing non-flat items awkward", "Expensive"]
  },
   "Cote & Ciel Nile": { // Check name
     pros: ["Striking design with integrated hood", "Obsidian material is unique", "Good laptop protection"],
     cons: ["Hood is a gimmick for some", "Very expensive", "Practical capacity might be less than dimensions suggest"]
   },
  // --- Cotopaxi ---
   _cotopaxiGeneral: {
    pros: ["Distinctive bright, multi-colored designs (often using repurposed materials - Del Día)", "Focus on travel and outdoor adventure", "B Corp certified (ethical/sustainable focus)"],
    cons: ["Bright colors aren't for everyone/all situations", "Del Día items are unique but you don't choose the exact colors online", "Harness systems are good but maybe less technical than pure hiking brands for heavy loads"]
  },
  "Cotopaxi Allpa 28L": { // Check name (and 42L version)
     pros: ["Excellent travel packs", "Full clamshell opening with internal zippered mesh compartments", "Stowable harness", "Durable TPU-coated front panel", "Included rain cover (often)"],
     cons: ["Can be boxy", "TPU panel can scuff", "Bright colors might not suit business travel"]
   },
   "Cotopaxi Batac 24L": { // Check name
     pros: ["Lightweight, packable daypack", "Often made with remnant fabrics (Del Día - unique colors)", "Simple design", "Good for travel day trips or light hikes"],
     cons: ["Minimal structure or padding", "Basic organization", "Thin materials (by design)"]
   },
  // --- Evergoods ---
   _evergoodsGeneral: {
    pros: ["Exceptional build quality and materials (custom textiles)", "Focus on ergonomics and comfortable carry", "Unique blend of outdoor durability with urban aesthetics", "Thoughtful access and features"],
    cons: ["Premium price point", "Unique design language isn't for everyone", "Organization can be minimalist in some areas"]
  },
   "Evergoods CHZ22": { // Check name (and 26L version)
     pros: ["Comfortable harness", "Durable materials", "Quick top access + partial front zip", "Streamlined look"],
     cons: ["Access might not suit those who prefer full clamshell", "Relatively simple internal layout"]
   },
   "Evergoods CPL24": { // Check name
     pros: ["Excellent comfort and ergonomics", "Durable", "Full front panel access to main compartment", "Dedicated laptop compartment with great access"],
     cons: ["Lies flat, doesn't stand on its own", "Side access can be fiddly for some items"]
   },
  // --- Fjällräven ---
   _fjallravenGeneral: {
    pros: ["Iconic Scandinavian design aesthetic", "Durable materials (especially G-1000 fabric which can be waxed)", "Focus on sustainability and longevity", "Recognizable branding"],
    cons: ["Can be expensive", "G-1000 needs waxing for full water resistance", "Boxy shapes aren't always ergonomic", "Harness systems often simple (especially Kånken)"]
  },
  "Fjallraven Kanken 17": { // Assuming maps to Kånken Laptop 17"
     pros: ["Iconic and fashionable design", "Durable Vinylon F or G-1000 fabric", "Wide U-shaped opening", "Included seat pad", "Dedicated padded laptop compartment"],
     cons: ["Very basic, thin shoulder straps (can be uncomfortable with heavy loads)", "Minimal back padding/ventilation", "Boxy shape isn't body-hugging"]
   },
   "Fjallraven Raven 28": { // Check name
     pros: ["More conventional backpack design than Kånken", "Durable G-1000 fabric", "Good organization for EDC/school", "Comfortable padded straps and back panel", "Dedicated laptop sleeve"],
     cons: ["Heavier than Kånken", "G-1000 needs waxing for best water resistance"]
   },
  // --- GoRuck ---
   _goruckGeneral: {
    pros: ["Extreme durability (\"bombproof\" construction, 1000D Cordura)", "Lifetime guarantee (SCARS warranty)", "Opens flat (clamshell)", "Excellent for heavy loads", "MOLLE for customization", "Made in USA options"],
    cons: ["Very expensive", "Heavy even when empty", "Requires a break-in period for comfort", "Minimalist internal organization (relies on packing cubes/pouches)", "Tactical aesthetic", "Back panel can be abrasive on some fabrics"]
  },
   "Goruck GR1 21L": { // Check name (and 26L version)
     pros: ["The iconic GoRuck pack", "Extremely tough", "Great for EDC/travel/fitness (rucking)", "Excellent laptop compartment"],
     cons: ["All the general GoRuck cons apply - cost, weight, break-in"]
   },
    // --- Gregory ---
     _gregoryGeneral: {
       pros: ["Known for excellent harness systems and carry comfort (especially hiking packs)", "Durable construction", "Focus on ergonomics and fit", "Good value"],
       cons: ["Designs often prioritize function/comfort over cutting-edge aesthetics", "Can be slightly heavier than minimalist brands"]
     },
    "Gregory Border 35": { // Check name (and 25L version)
      pros: ["Designed for travel convenience", "Clamshell or panel opening", "Dedicated laptop sleeve", "Comfortable back panel/straps", "Often meets carry-on specs"],
      cons: ["Aesthetic is fairly conventional travel/commuter"]
    },
    "Gregory Nano 22": { // Check name
      pros: ["Lightweight and affordable daypack", "Comfortable ventilated back panel for its class", "Hydration compatible", "Good for light hikes or casual use"],
      cons: ["Basic organization", "Materials are lighter weight (less robust than heavy-duty packs)"]
    },
  // --- Haglöfs ---
   _haglofsGeneral: {
    pros: ["Swedish outdoor brand", "Focus on functional/durable gear", "Often uses sustainable materials", "Clean Scandinavian design influences", "Good technical features"],
    cons: ["Can be harder to find in some regions", "Price point can be mid to high", "Specific technical focus might not suit casual users"]
  },
   "Haglofs Tight Pro Large": { // Check name
     pros: ["Iconic teardrop shape hugs the back well (good stability)", "Durable materials", "Suitable for hiking/climbing/general use"],
     cons: ["Shape might limit packing bulky items", "Access is typically top-loading"]
   },
   "Haglofs Vide Medium": { // Check name
     pros: ["Versatile daypack size", "Likely good organization for EDC/light hikes", "Durable construction"],
     cons: ["Aesthetic is typically outdoorsy/functional"]
   },
  // --- Heimplanet ---
    _heimplanetGeneral: {
      pros: ["Innovative designs and features", "Often modular or adaptable", "High-quality materials", "Unique aesthetics", "Focus on travel and outdoor crossover"],
      cons: ["Can be expensive", "Unique features might add complexity", "Aesthetic is distinct and not for everyone"]
    },
    "Heimplanet Monolith Daypack": { // Check name
      pros: ["Adaptable volume", "Multiple carry options (with optional straps)", "Durable materials", "Sleek look"],
      cons: ["Relying on optional straps adds cost/complexity", "Organization might depend on added pouches"]
    },
    "Heimplanet Transit Line Travel Pack": { // Check name
      pros: ["Designed for one-bag travel", "Clamshell opening", "Good organization", "Durable and weather-resistant materials", "Comfortable harness"],
      cons: ["Pricey", "Can be slightly heavy"]
    },
  // --- Herschel ---
    _herschelGeneral: {
        pros: ["Very popular, fashion-focused retro/heritage aesthetic", "Wide range of colors and patterns", "Generally affordable", "Recognizable branding"],
        cons: ["Build quality and materials are decent but not top-tier", "Comfort is basic (simple straps/back panel)", "Organization is often minimal", "Faux leather straps can wear out"]
    },
    "Herschel Little America": { // Check name
        pros: ["Iconic mountaineering-inspired design", "Large capacity", "Internal laptop sleeve", "Distinctive look"],
        cons: ["Flap and drawstring closure isn't quick access", "Magnetic strap closures can be weak", "Basic comfort"]
    },
    "Herschel Settlement": { // Check name
        pros: ["Classic school backpack design", "Simple and functional", "Exposed zipper aesthetic", "Affordable"],
        cons: ["Very basic organization and comfort", "Materials are standard"]
    },
   // --- Kelty ---
    _keltyGeneral: {
        pros: ["Long-standing outdoor brand", "Focus on durable and affordable hiking/camping gear", "Comfortable carry systems (especially on larger packs)", "Practical features"],
        cons: ["Aesthetic is traditional outdoorsy", "Might be heavier than some competitors", "May lack the sleekness of urban brands"]
    },
    "Kelty Asher 25": { // Check name (and 35/45/55/65)
        pros: ["Good value hiking packs", "Adjustable and comfortable suspension systems (especially larger sizes)", "Durable materials", "Standard hiking features (hydration sleeve, pockets, attachment points)"],
        cons: ["Less sophisticated suspension than premium brands on smaller sizes potentially", "Functional aesthetic"]
    },
    "Kelty Redwing 32": { // Check name (and 44)
        pros: ["Very popular crossover hike/travel packs", "Hybrid panel-loader access (U-zip)", "Good organization", "Comfortable carry", "Durable"],
        cons: ["Can be slightly heavy", "Design is a bit dated for some", "Might be too large/feature-rich for simple day use"]
    },
   // --- Matador ---
    _matadorGeneral: {
        pros: ["Focus on lightweight, packable, weather-resistant gear for travel and adventure", "Innovative designs", "High-quality materials (often Robic nylon, waterproof coatings)"],
        cons: ["Lightweight materials may be less abrasion resistant than heavy Cordura", "Packability often means less structure/padding", "Unique designs can be polarizing", "Premium pricing"]
    },
    "Matador Freerain 32": { // Check name (and 24L)
        pros: ["Extremely lightweight and packable waterproof backpack (roll-top)", "Great as a summit pack or travel daypack"],
        cons: ["Very minimal structure and comfort (thin straps)", "Roll-top access only"]
    },
    "Matador Seg28": { // Check name (and 42/45)
        pros: ["Unique segmented design for organization (no cubes needed)", "Lay-flat access to segments", "Lightweight for travel"],
        cons: ["Segmented design limits carrying large single items", "Might feel floppy if not fully packed", "Thin materials"]
    },
   // --- Millican ---
    _millicanGeneral: {
        pros: ["Strong focus on sustainability (recycled/natural materials like Bionic Canvas)", "Heritage aesthetic", "Durable construction", "Functional designs for travel/outdoors"],
        cons: ["Can be expensive", "Natural materials may require more care (waxing canvas)", "Aesthetic is specific", "Can be heavier than synthetic packs"]
    },
    "Millican Fraser Rucksack 32L": { // Check name
        pros: ["Classic rucksack design", "Durable and weather-resistant canvas", "Comfortable harness", "Good capacity"],
        cons: ["Drawstring and flap access isn't quick", "Needs waxing for optimal water resistance"]
    },
    "Millican Smith Roll Pack 25L": { // Check name
        pros: ["Roll-top provides weather resistance and variable capacity", "Sustainable materials", "Clean look", "External pockets"],
        cons: ["Roll-top access", "Requires waxing"]
    },
   // --- Minaal ---
    _minaalGeneral: {
        pros: ["Sleek, minimalist design for digital nomads/one-bag travel", "High-quality materials and construction", "Excellent harness system that hides away cleanly", "Thoughtful features for travelers"],
        cons: ["Very expensive", "Minimalist aesthetic might lack quick-access pockets for some", "Design prioritizes travel over EDC versatility sometimes"]
    },
    "Minaal Carry-on 2.0": { // Check name (and 3.0)
        pros: ["Optimized for one-bag carry-on travel", "Lay-flat opening", "Excellent stowable harness", "Durable", "Professional look"],
        cons: ["High cost", "Internal organization relies on main space (use cubes)"]
    },
    "Minaal Daily 2.0": { // Check name (and 3.0)
        pros: ["Smaller version for EDC/shorter trips", "Maintains sleek look and hideaway harness", "Good laptop protection"],
        cons: ["Expensive for an EDC bag", "Capacity is limited"]
    },
   // --- Mountain Hardwear ---
    _mountainHardwearGeneral: {
        pros: ["Focus on technical outdoor performance (climbing, mountaineering)", "Durable and often lightweight materials", "Innovative features for alpine environments", "Comfortable carry systems for load bearing"],
        cons: ["Highly technical aesthetic", "Might be overbuilt/over-featured for casual use", "Price reflects technical nature"]
    },
     "Mountain Hardwear Camp 4 40": { // Check name
        pros: ["Durable materials", "Multiple carry options (backpack straps, grab handles)", "Good capacity for gear hauling"],
        cons: ["Backpack carry might be secondary comfort", "Potentially simple organization"]
    },
    "Mountain Hardwear Scrambler 30": { // Check name (and 35L)
        pros: ["Lightweight yet durable climbing/alpine pack", "Streamlined design", "Top-loading access", "Comfortable carry for active use", "Often weather resistant"],
        cons: ["Minimalist organization", "Top-access only", "Technical look"]
    },
   // --- Mystery Ranch ---
    _mysteryRanchGeneral: {
        pros: ["Known for exceptionally comfortable and adjustable harness systems (Futura Yoke)", "Extremely durable construction (military heritage)", "Unique 3-zip access design on many models", "Focus on load carry"],
        cons: ["Can be heavy", "Expensive", "Harness system adds bulk", "Aesthetic is distinct (military/outdoor blend)", "3-zip isn't for everyone"]
    },
    "Mystery Ranch 2 Day Assault": { // Check name
        pros: ["Tactical features (MOLLE, laptop sleeve)", "Robust build", "Comfortable harness", "3-zip access"],
        cons: ["Tactical look", "Heavy", "Expensive"]
    },
    "Mystery Ranch Urban Assault 18": { // Check name (and 21/24)
        pros: ["Signature 3-zip access for easy opening", "Durable build", "Comfortable carry", "Multiple sizes for EDC needs"],
        cons: ["3-zip makes utilizing full volume tricky sometimes", "Less internal organization than some EDC packs", "Heavier than competitors"]
    },
    // --- NOMATIC / GOMATIC ---
    _nomaticGeneral: {
        pros: ["Focus on extreme organization and features for travel/tech users", "Durable and water-resistant materials", "Innovative expandable systems", "Sleek black aesthetic"],
        cons: ["Can be very heavy due to features/materials", "Organization can feel overly complex or rigid", "Expensive", "Boxy shape", "Straps sometimes criticized for comfort on heavy loads"]
    },
    "Nomad Lane Bento Bag": { // Assuming maps to NOMATIC Bento Bag
        pros: ["Unique personal item/briefcase", "Extremely organized for tech and essentials", "Integrates with larger NOMATIC bags"],
        cons: ["Small capacity", "Very specific use case", "Expensive"]
    },
    "NOMATIC Travel Pack 40L": { // Check name (also covers 20-30L Travel Pack)
        pros: ["Feature-packed for one-bag travel", "Expandable", "Dedicated compartments (shoes, tech, clothes)", "Durable/water-resistant"],
        cons: ["Very heavy", "Complex organization", "Can become bulky and uncomfortable when fully packed", "Expensive"]
    },
     "NOMATIC Backpack 20L": { // Check name - maps to Backpack?
        pros: ["Highly organized EDC/commuter bag", "Expandable", "Durable", "Lots of features (key leash, RFID pocket etc)"],
        cons: ["Heavy", "Complex", "Boxy"]
    },
   // --- Osprey ---
    _ospreyGeneral: {
        pros: ["Excellent harness systems and carry comfort", "Great ventilation (AirSpeed back panels)", "Durable construction", "Excellent warranty (\"All Mighty Guarantee\")", "Wide range of packs for hiking/travel/biking", "Thoughtful features"],
        cons: ["Aesthetic is often outdoorsy/technical", "Can have many straps", "Might be heavier than minimalist options"]
    },
     "Osprey Daylite Plus": { // Check name (covers Daylite Plus / Daylite Plus 20L)
        pros: ["Lightweight, versatile daypacks", "Attach to larger Osprey packs", "Comfortable for size", "Hydration compatible", "Adds front shove-it pocket"],
        cons: ["Minimal structure", "Less robust harness than larger packs"]
    },
    "Osprey Daylite 26+6": { // Check name
        pros: ["Lightweight, versatile daypacks", "Attach to larger Osprey packs", "Comfortable for size", "Hydration compatible", "Offers expansion"],
        cons: ["Minimal structure", "Less robust harness than larger packs"]
    },
    "Osprey Farpoint 40": { // Check name (and 55L)
        pros: ["Hugely popular travel pack series (Fairview for women)", "Comfortable load-carrying harness that stows away", "Durable materials", "Lockable zippers", "Often carry-on compliant"],
        cons: ["Can look bulky"]
    },
     "Osprey Farpoint 55L": { // Check name (and 55)
        pros: ["Hugely popular travel pack series (Fairview for women)", "Comfortable load-carrying harness that stows away", "Durable materials", "Lockable zippers", "Includes a detachable daypack"],
        cons: ["Can look bulky", "Detachable daypack adds complexity/weight if not needed"]
    },
    "Osprey Porter 30L": { // Check name (and 30)
        pros: ["Travel duffel/backpack hybrid with rigid sidewalls (offers protection, holds shape)", "Stowable harness", "Lots of capacity", "Very durable external fabric"],
        cons: ["Boxy shape", "Harness is less substantial than Farpoint (better for shorter carries)", "Rigid sides mean it doesn't compress well"]
    },
    "Osprey Porter 46": { // Check name
        pros: ["Travel duffel/backpack hybrid with rigid sidewalls", "Stowable harness", "Lots of capacity", "Very durable external fabric"],
        cons: ["Boxy shape", "Harness less substantial than Farpoint", "Rigid sides don't compress well"]
    },
   // --- Patagonia ---
    _patagoniaGeneral: {
        pros: ["Strong environmental and ethical stance (B Corp, Fair Trade certified, recycled materials)", "Durable products", "Functional designs", "Good warranty/repair program"],
        cons: ["Can be expensive", "Aesthetic is often outdoorsy/casual", "Features might be less cutting-edge than some tech-focused brands"]
    },
    "Patagonia Black Hole 25L": { // Check name (and 32L)
        pros: ["Extremely durable and highly weather-resistant TPU-laminated fabric", "Simple and robust designs", "Backpack straps"],
        cons: ["Shiny fabric shows scuffs (patina)", "Organization is often basic (large main compartment)", "Back panel ventilation might be limited"]
    },
    "Patagonia Black Hole 40L": { // Check name (maps to 40L Duffel Pack?)
        pros: ["Extremely durable and highly weather-resistant TPU-laminated fabric", "Simple and robust design", "Huge opening", "Removable backpack straps"],
        cons: ["Shiny fabric shows scuffs", "Organization is basic", "Primarily a duffel"]
    },
    "Patagonia Refugio 26L": { // Check name
        pros: ["Versatile daypack for EDC/light hikes", "Good organization with multiple compartments", "Comfortable straps/back panel", "Often uses recycled materials"],
        cons: ["Conventional daypack look", "Less weather resistant than Black Hole"]
    },
   // --- Peak Design ---
    _peakDesignGeneral: {
        pros: ["Highly innovative features (MagLatch, FlexFold dividers, Capture Clip integration)", "Premium build quality and materials", "Sleek modern aesthetic", "Great for photographers but versatile for tech/EDC/travel too"],
        cons: ["Very expensive", "Innovative features can add weight/complexity", "Unique aesthetic isn't for everyone", "Internal organization relies heavily on dividers/pouches"]
    },
    "Peak Design Everyday Backpack 20L": { // Check name (and 30L)
        pros: ["Excellent side access", "Brilliant FlexFold dividers for customizable organization (photo/tech)", "MagLatch closure allows expansion", "Weatherproof"],
        cons: ["Heavy", "Expensive", "Side access might not suit everyone", "MagLatch takes practice"]
    },
    "Peak Design Everyday Backpack Zip 15L": { // Check name (and 20L)
        pros: ["Simpler zip access version of EDB", "Cleaner look", "Retains divider system (usually one)", "Weatherproof"],
        cons: ["Less adaptable capacity than MagLatch version", "Single main compartment access via zip"]
    },
     "Peak Design Everyday Sling 3L": { // Check name (and 6L)
        pros: ["Well-designed slings for cameras or EDC", "Include FlexFold divider", "Comfortable carry", "Quick access"],
        cons: ["Limited capacity", "Premium price for a sling"]
    },
    "Peak Design Travel Backpack 30L": { // Check name (and 45L/65L)
        pros: ["Highly versatile travel system", "Expandable/compressible design", "Full back panel access", "Integrates with PD packing cubes/camera cubes", "Stowable straps"],
        cons: ["Heavy", "Very expensive (especially with accessories)", "Harness comfort debated for very heavy loads"]
    },
    "Peak Design Travel Duffel 35L": { // Check name (and 65L)
        pros: ["Exceptionally wide doctor's bag style opening", "Weatherproof", "Multiple carry options (inc. backpack straps)", "Integrates with PD cubes"],
        cons: ["Heavy for a duffel", "Backpack straps are basic comfort", "Premium price"]
    },
   // --- Rains ---
    _rainsGeneral: { // No data provided, make generic guess
        pros: ["Minimalist aesthetic", "Often waterproof or highly water-resistant", "Focus on urban style"],
        cons: ["Comfort might be basic", "Organization often simple", "Materials might prioritize look over ruggedness"]
    },
    "Rains Backpack": { // Use general guess
        pros: ["Minimalist aesthetic", "Likely water-resistant", "Urban style"],
        cons: ["Basic comfort", "Simple organization"]
    },
    "Rains Rolltop Backpack": { // Use general guess + rolltop specific
        pros: ["Minimalist aesthetic", "Waterproof roll-top main compartment", "Variable capacity"],
        cons: ["Roll-top access isn't quick", "Basic comfort", "Simple organization"]
    },
   // --- Recycled Firefighter ---
    _recycledFirefighterGeneral: {
        pros: ["Uses repurposed/durable materials (like decommissioned fire hose, Cordura)", "Simple and robust designs", "Often made in USA", "Unique aesthetic"],
        cons: ["Materials can be stiff initially", "Availability of specific hose colors varies", "Organization is typically very basic", "Comfort is functional"]
    },
    "Recycled Firefighter 24 Hour": { // Check name
        pros: ["Very durable construction", "Simple panel-loader access", "Often features fire hose accents", "Good size for EDC/overnight"],
        cons: ["Basic harness/back panel comfort", "Minimal internal organization", "Can be stiff"]
    },
   // --- Red Oxx ---
    _redOxxGeneral: {
        pros: ["Extremely durable (\"bombproof\") construction (1000D Cordura, huge zippers)", "Made in USA", "Lifetime warranty (\"No Bull\")", "Focus on simple, highly functional travel gear (especially non-wheeled)"],
        cons: ["Very utilitarian/basic aesthetic", "Minimal internal organization (designed for packing cubes)", "Can be heavy", "No padding/structure in many bags", "Expensive"]
    },
    "Red Oxx Air Boss": { // Check name
        pros: ["Legendary non-wheeled carry-on shoulder bag", "Three main compartments for organization", "Incredibly durable", "Meets carry-on specs"],
        cons: ["Shoulder carry only (heavy when packed)", "No padding", "Requires packing cubes"]
    },
    "Red Oxx C-Ruck": { // Check name
        pros: ["Extremely durable ruck sack", "Simple large main compartment", "External pockets", "Comfortable straps for load"],
        cons: ["Heavy", "Basic design", "Tactical/military aesthetic influence"]
    },
    "Red Oxx Metro": { // Check name (and Metro Backpack)
        pros: ["Simple, durable briefcase/backpack for EDC", "Robust materials"],
        cons: ["Basic design and organization", "Utilitarian look"]
    },
   // --- Remote Equipment ---
    "Remote Equipment Alpha 31": { // Check name
        pros: ["Highly adaptable bag (multiple access points, adjustable capacity)", "Durable and weather-resistant materials", "Comfortable carry"],
        cons: ["Complex design isn't for everyone", "High price point"]
    },
   // --- ROFMIA ---
    _rofmiaGeneral: { // No data provided, inferring based on reputation
        pros: ["Extremely lightweight (often Dyneema)", "Minimalist design", "High quality construction", "Weather resistant"],
        cons: ["Very expensive", "Minimalist organization", "Dyneema has specific look/feel/sound", "Limited availability"]
    },
    "ROFMIA Backpack V2": { // Apply general
        pros: ["Extremely lightweight (often Dyneema)", "Minimalist design", "High quality construction", "Weather resistant"],
        cons: ["Very expensive", "Minimalist organization", "Dyneema has specific look/feel/sound", "Limited availability"]
    },
    "ROFMIA Daypack V2": { // Apply general
        pros: ["Extremely lightweight (often Dyneema)", "Minimalist design", "High quality construction", "Weather resistant"],
        cons: ["Very expensive", "Minimalist organization", "Dyneema has specific look/feel/sound", "Limited availability"]
    },
   // --- Samsonite ---
    _samsoniteGeneral: {
        pros: ["Widely available mainstream brand", "Focus on business travel and commuting", "Often feature good laptop protection and organization for work items", "Competitive pricing"],
        cons: ["Build quality and materials are typically good but not premium/rugged", "Designs prioritize function over style often", "Comfort might be basic"]
    },
    "Samsonite Tectonic 2": { // Check name
        pros: ["Spacious commuter/business backpack", "Lots of organizational pockets", "Padded laptop compartment", "Affordable"],
        cons: ["Can be bulky", "Aesthetic is standard business/tech", "Materials are average"]
    },
    "Samsonite Xenon 3.0": { // Check name
        pros: ["Sleeker design than Tectonic", "Good organization for business essentials", "Dedicated laptop/tablet sleeves", "Affordable"],
        cons: ["Materials and long-term durability might not match premium brands", "Comfort is standard"]
    },
   // --- Sandqvist ---
    _sandqvistGeneral: {
        pros: ["Swedish brand with focus on stylish, functional bags using sustainable/recycled materials", "Blend of heritage and modern Scandinavian design", "Durable construction"],
        cons: ["Can be relatively expensive", "Roll-top/flap closures common (less quick access)", "Comfort might be secondary to style on some models"]
    },
    "Sandqvist Bernt": { // Check name
        pros: ["Popular roll-top design", "Water-resistant (especially Cordura versions)", "Good size for EDC/commute", "Internal laptop sleeve", "Stylish look"],
        cons: ["Roll-top access", "Potentially basic internal organization"]
    },
    "Sandqvist Zack": { // Check name
        pros: ["Likely stylish design", "Durable materials (possibly canvas or recycled poly)", "Functional for EDC"],
        cons: ["Check access method (flap/roll-top?)", "Potentially simple organization/comfort"]
    },
   // --- Shimoda Designs ---
    _shimodaGeneral: {
        pros: ["Designed specifically for adventure/outdoor photographers", "Highly adjustable and comfortable harness system (women's straps available)", "Customizable interior via modular Core Units", "Rear and side camera access", "Durable/weather-resistant materials"],
        cons: ["Very expensive (especially with Core Units)", "Primarily designed for camera gear (less ideal as general travel bag without removing inserts)", "Can be bulky/heavy", "Complex system"]
    },
    "Shimoda Action X30": { // Check name (and X50/X70, V2)
        pros: ["Top-tier adventure photo pack", "Roll-top access for variable volume", "Robust harness for heavy loads", "Multiple access points", "Highly weather resistant"],
        cons: ["Heavy", "Expensive", "Focused on photo gear"]
    },
    "Shimoda Explore V2 25L": { // Check name (and 30L/35L)
        pros: ["Slightly lighter/more streamlined than Action X", "Still excellent harness and core unit system", "Rear access. Good for travel/landscape photographers"],
        cons: ["Expensive", "Photo-centric design"]
    },
   // --- The North Face ---
    _thenorthfaceGeneral: {
        pros: ["Well-known outdoor/lifestyle brand", "Durable construction", "Comfortable harness systems (FlexVent)", "Good organization in daypacks", "Widely available"],
        cons: ["Designs can be mainstream", "Might be heavier than some competitors", "Technical features less prominent than pure hiking brands sometimes"]
    },
    "The North Face Base Camp Voyager 32L": { // Check name
        pros: ["Uses durable, water-resistant Base Camp fabric (like duffels)", "Laptop sleeve", "Good organization for travel/EDC", "More comfortable harness than duffel straps"],
        cons: ["Fabric can scuff", "Potentially less back ventilation than mesh panels"]
    },
    "The North Face Borealis": { // Check name
        pros: ["Very popular all-around daypack", "Comfortable FlexVent harness", "Good organization with laptop/tablet sleeves", "External bungee cord", "Stands on its own (newer versions)"],
        cons: ["Can be slightly heavy", "Ubiquitous design"]
    },
    "The North Face Recon": { // Check name
        pros: ["Similar to Borealis but often with slightly more volume/organization", "Comfortable FlexVent harness", "Durable", "Large front mesh pocket"],
        cons: ["Slightly larger/heavier than Borealis", "Mainstream look"]
    },
   // --- Thule ---
    _thuleGeneral: {
        pros: ["Scandinavian design influence (clean lines)", "Durable materials", "Focus on travel/tech carry/active use", "Thoughtful organization and features (like crushproof SafeZone pockets)"],
        cons: ["Can be relatively expensive", "Designs might feel a bit corporate/technical", "Harness comfort good but maybe less plush than Osprey for some"]
    },
    "Thule Crossover 32L": { // Check name
        pros: ["Durable materials", "Good organization for tech/travel", "Crushproof SafeZone compartment", "Comfortable straps"],
        cons: ["Can be slightly heavy/bulky", "Aesthetic is functional/techy"]
    },
    "Thule Landmark 40L": { // Check name
        pros: ["Travel-focused pack", "Stowable harness", "SafeZone compartment", "Lockable zippers", "Female-fit version available"],
        cons: ["Aesthetic is typical travel pack", "Might lack some granular organization inside"]
    },
    "Thule Subterra 34L": { // Check name
        pros: ["Sleek design for travel/commute", "Roll-top access to main compartment with side zip access too", "Removable packing cube often included", "Good laptop protection"],
        cons: ["Roll-top access isn't for everyone", "Can be pricey"]
    },
   // --- Timbuk2 ---
    _timbuk2General: {
        pros: ["Known for durable messenger bags and backpacks", "Urban/commuter focus", "Often customizable", "Good laptop protection", "Decent value"],
        cons: ["Designs can be less innovative than some newer brands", "Comfort is usually good but functional", "Aesthetic is often casual/urban"]
    },
    "Timbuk2 Division": { // Check name
        pros: ["Simple, sleek commuter backpack", "Good laptop protection", "Rear zip access to laptop", "Affordable"],
        cons: ["Basic organization", "Standard materials"]
    },
    "Timbuk2 Never Check": { // Check name
        pros: ["Designed for short trips/overnights", "Expandable capacity", "Good organization for clothes/tech", "Converts between backpack/briefcase"],
        cons: ["Can get bulky when expanded", "Might be heavy"]
    },
   // --- Tom Bihn ---
    _tomBihnGeneral: {
        pros: ["Legendary durability and build quality (often US-made)", "Extremely thoughtful design and organization based on user feedback", "Comfortable harness systems", "Loyal following", "Vast array of optional accessories (pouches, cubes)"],
        cons: ["Very expensive", "Designs prioritize function over trendy aesthetics (can look 'nerdy' or dated to some)", "Internal organization relies heavily on specific pocket layout (less open space)", "Often requires buying accessories separately"]
    },
    "Tom Bihn Aeronaut 45": { // Check name
        pros: ["Classic soft-sided travel bag (duffel with backpack straps)", "Huge capacity", "Extremely durable", "Multiple carry options"],
        cons: ["Max carry-on size (can get heavy)", "Backpack straps less comfy than dedicated packs", "Needs packing cubes"]
    },
    "Tom Bihn Synapse 25": { // Check name
        pros: ["Highly regarded EDC/travel pack", "Famous for its external pocket organization (easy access without opening main bag)", "Comfortable harness", "Durable"],
        cons: ["Main compartment shape isn't ideal for bulky items", "Specific look"]
    },
    "Tom Bihn Synik 22": { // Check name (and 30L)
        pros: ["Updated version of Synapse concept with clamshell opening", "Integrated laptop compartment", "Refined harness"],
        cons: ["Clamshell adds weight/complexity vs Synapse for some", "Expensive"]
    },
    "Tom Bihn Techonaut 30": { // Check name
        pros: ["Clamshell travel bag evolution of Aeronaut concept", "Integrated laptop sleeve", "More comfortable backpack straps"],
        cons: ["Expensive", "Still benefits from packing cubes"]
    },
   // --- Topo Designs ---
    _topoDesignsGeneral: {
        pros: ["Distinctive retro/heritage outdoor aesthetic with bright color blocking", "Durable materials (often Cordura)", "Made in USA options", "Simple and functional designs"],
        cons: ["Can be expensive (especially USA-made)", "Organization is often simple", "Comfort is good but maybe less technical than dedicated hiking brands", "Boxy shapes"]
    },
    "Topo Designs Core Pack": { // Check name
        pros: ["Simple, durable EDC pack", "Clean look", "Likely internal laptop sleeve"],
        cons: ["Basic organization and comfort compared to feature-rich packs"]
    },
    "Topo Designs Global Travel Bag 30L": { // Check name
        pros: ["Smaller version of their travel pack", "Good for shorter trips/lighter packers", "Clamshell", "Durable", "Distinct style"],
        cons: ["Boxy", "Simple internal layout", "Price"]
    },
   // --- Tortuga ---
    _tortugaGeneral: {
        pros: ["Designed specifically for urban one-bag travel", "Excellent harness systems (height adjustable on Outbreaker)", "Lay-flat clamshell opening", "Great organization for tech/clothes", "Durable materials (sailcloth on Outbreaker)"],
        cons: ["Can be heavy (especially Outbreaker)", "Boxy shape isn't very streamlined", "Expensive", "Focus is purely travel (less ideal as EDC)"]
    },
    "Tortuga Outbreaker 35L": { // Check name (and 45L)
        pros: ["Extremely comfortable and adjustable harness for a travel pack", "Highly weather-resistant sailcloth", "Excellent organization", "Lay-flat design"],
        cons: ["Heavy", "Stiff structure", "Very boxy", "Expensive"]
    },
     "Tortuga Setout 45L": { // Check name
        pros: ["Lighter and less rigid than Outbreaker", "Still good harness and organization", "More affordable"],
        cons: ["Less weather resistant than Outbreaker", "Harness less adjustable", "Still fairly boxy"]
    },
    "Tortuga Setout Divide": { // Check name
        pros: ["Lighter and less rigid than Outbreaker", "Still good harness and organization", "More affordable", "Expandable"],
        cons: ["Less weather resistant than Outbreaker", "Harness less adjustable", "Still fairly boxy"]
    },
    "Tortuga Travel Backpack 40L": { // Likely older model, using general info
        pros: ["Designed for urban one-bag travel", "Lay-flat clamshell opening", "Good organization", "Durable materials"],
        cons: ["Boxy shape", "Expensive"]
    },
   // --- Tropicfeel ---
    _tropicfeelGeneral: {
        pros: ["Focus on versatile travel gear with modularity/expandability", "Often lightweight and use sustainable materials", "Unique features aimed at travelers (shoe compartments, wardrobe systems)"],
        cons: ["Systems can be complex", "Might feel less robust than heavy-duty brands", "Relies on buying modules for full functionality", "Harness comfort might be basic"]
    },
    "Tropicfeel Nest": { // Check name
        pros: ["Adaptable EDC/travel pack", "Expandable capacity", "Minimalist design", "Lightweight"],
        cons: ["Simple structure/harness", "Organization might depend on packing"]
    },
    "Tropicfeel Shell": { // Check name
        pros: ["Highly modular travel backpack system", "Expandable", "Integrates with wardrobe system and accessories", "Clamshell opening"],
        cons: ["Base bag might lack structure/features without accessories", "Can get expensive as a system", "Complex"]
    },
   // --- Tumi ---
    _tumiGeneral: {
        pros: ["Luxury business/travel brand", "Premium materials (ballistic nylon, leather accents)", "Excellent build quality", "High level of organization for business travelers", "Status symbol", "Tracer program for lost bags"],
        cons: ["Extremely expensive", "Can be heavy", "Designs prioritize professional look over cutting-edge features or comfort sometimes", "Aesthetic might feel conservative/corporate"]
    },
    "Tumi Alpha Bravo Search": { // Check name
        pros: ["Robust construction", "Lots of pockets for organization", "Professional look", "Durable"],
        cons: ["Heavy", "Very expensive", "Traditional business aesthetic"]
    },
    "Tumi Voyageur Calais": { // Check name
        pros: ["Lighter weight, more feminine/sleek design than Alpha Bravo", "Still good organization", "Premium materials"],
        cons: ["Very expensive", "Might be less durable than Alpha Bravo", "Fashion-focused"]
    },
   // --- ULA Equipment ---
    _ulaGeneral: {
        pros: ["Legendary in the ultralight backpacking community", "Extremely lightweight yet durable packs", "Comfortable load carry for their weight class", "Customizable options", "Made in USA"],
        cons: ["Minimalist designs lack extensive organization", "Ultralight materials require some care", "Aesthetic is pure function/ultralight (roll tops, external mesh pockets)", "Premium price for ultralight gear"]
    },
    "ULA Atlas": { // Check name
        pros: ["Likely very durable build", "Good load carrying capacity", "Simpler design than ultralight packs"],
        cons: ["Heavier than ULA's ultralight line", "Basic aesthetic"]
    },
    "ULA Circuit": { // Check name
        pros: ["Very popular lightweight multi-day backpacking pack", "Comfortable harness system", "Large capacity", "Durable for its weight"],
        cons: ["Minimalist features", "Roll-top access", "Requires careful packing"]
    },
    "ULA Dragonfly Ultra": { // Check name
        pros: ["Exceptionally lightweight travel/EDC pack using Ultra fabric", "Clamshell opening", "Surprisingly comfortable carry"],
        cons: ["Very expensive", "Ultra fabric has specific look/feel", "Minimal padding/structure"]
    },
   // --- Vaude ---
    _vaudeGeneral: {
        pros: ["German brand with strong focus on sustainability and fair labor practices (Green Shape label)", "Functional designs for cycling/hiking/urban use", "Often good value", "Comfortable carry systems"],
        cons: ["Aesthetic is often functional/eco-conscious", "Availability might vary by region", "May lack the extreme features of specialized brands"]
    },
    "Vaude CityGo 23": { // Check name
        pros: ["Stylish urban commuter pack", "Often uses recycled materials", "Good organization for size", "Comfortable back panel"],
        cons: ["Casual focus", "Might lack robustness of technical packs"]
    },
    "Vaude Wizard 30+4": { // Check name
        pros: ["Versatile hiking daypack/overnighter", "Expandable volume (+4L)", "Comfortable and ventilated back system (Aeroflex)", "Rain cover often included"],
        cons: ["Hiking-specific look", "Might be over-featured for pure EDC"]
    },
   // --- WANDRD ---
    _wandrdGeneral: {
        pros: ["Focus on photography/travel crossover", "Innovative access features (side access, roll-top)", "Durable and weather-resistant materials (tarpaulin)", "Sleek modern aesthetic"],
        cons: ["Can be expensive", "Designs can be complex", "Harness comfort sometimes debated for very heavy loads", "Photography focus might compromise general packing space"]
    },
    "Wandrd Duo Daypack": { // Check name
        pros: ["Unique dual side access + full clamshell opening", "Integrated organization ('infinite zip')", "Good for tech/camera EDC", "Weather resistant"],
        cons: ["Complex access system", "Might be heavy for size", "Pricey"]
    },
    "Wandrd PRVKE 31L": { // Check name (and 21L/41L)
        pros: ["Very popular photo/travel pack", "Roll-top for expandable capacity", "Quick side camera access (with camera cube)", "Durable/weatherproof materials", "Sleek look"],
        cons: ["Requires optional camera cube for photo use", "Roll-top access to main space isn't always quick", "Can get heavy"]
    },
    // --- NEW MAPPINGS FOR SKIPPED BAGS ---
    "Able Carry Daily": {
        pros: ["Robust build (X-Pac/Cordura options)", "Unique A-frame structure for shape retention/standing", "Comfortable harness", "Clean urban aesthetic", "Good water resistance", "Great size for EDC"],
        cons: ["Can be relatively heavy for its size", "Internal organization might be simpler than some competitors", "Premium price point"]
    },
    "Able Carry Max": {
        pros: ["Significant capacity (30L) for travel or large loads", "Very robust build quality", "Comfortable harness system designed for heavier loads", "A-frame structure", "Weather resistant"],
        cons: ["Large and potentially heavy/bulky for daily use", "Premium price point", "Specific aesthetic"]
    },
    "Alchemy Equipment 30L Zip Access": { // Mapping for AEL022
        pros: ["Premium materials (often Cordura/ATY Nylon, leather accents)", "Sleek minimalist aesthetic", "Comfortable harness", "Good organization including protective laptop sleeve", "Weather resistant"],
        cons: ["Expensive", "Minimalist look might lack quick-access pockets for some", "Capacity might feel constrained by sleek design"]
    },
    "Alchemy Equipment 35L Roll Top": { // Mapping for AEL005
        pros: ["Roll-top provides excellent weather resistance and variable capacity", "Premium materials", "Sleek design", "Comfortable carry", "Durable"],
        cons: ["Roll-top access is less convenient than zippers", "Potentially simpler internal organization", "Expensive"]
    },
    "Almond Oak Backpack": {
        pros: ["Likely focuses on style/aesthetics (perhaps natural materials or look)", "Potentially good for casual or light professional use"],
        cons: ["Specific features/durability/comfort unknown without model details", "Potentially basic organization or harness", "Might prioritize style over function"]
    },
    "Almond Oak Travel Pack": {
        pros: ["Likely designed for travel (carry-on size?)", "Potentially clamshell opening or good organization for packing", "Stylish aesthetic"],
        cons: ["Durability, harness comfort for travel loads, specific features unknown", "Might be less feature-rich than dedicated travel brands"]
    },
    "Black Diamond Stonehauler 45": {
        pros: ["Extremely durable haul-bag inspired construction", "Highly weather-resistant", "Padded sides protect contents", "Comfortable backpack straps for a duffel", "Multiple grab handles", "Clean design"],
        cons: ["Primarily a duffel; backpack carry is functional but less ergonomic than dedicated packs for long distances", "Can be bulky", "Simple internal organization"]
    },
    "Black Ember Citadel R2": {
        pros: ["Highly durable and weatherproof materials (Cordura RN66, Hypalon)", "Futuristic/technical aesthetic", "Modular (compatible with Ember pouches)", "Clamshell opening", "Protective design"],
        cons: ["Very expensive", "Heavy for its size", "Modularity requires buying extra components", "Aesthetic is very specific", "Internal organization relies somewhat on modules"]
    },
    "Black Ember Forge Max": {
        pros: ["Expandable capacity (20L-30L)", "Versatile carry modes (backpack, shoulder, briefcase)", "Highly weather resistant materials and construction", "Excellent build quality", "Organized compartments"],
        cons: ["Heavy", "Very expensive", "Complex expansion system and features", "Technical aesthetic"]
    },
    "Boundary Supply Errant Pack": {
        pros: ["Versatile EDC/camera/travel pack", "Multiple access points (top, front, side)", "Adaptable interior (with optional inserts)", "Sleek magnetic hardware", "Weather resistant"],
        cons: ["Can feel complex with many features/access points", "Organization might seem busy", "Optional inserts add cost", "Relatively heavy"]
    },
    "Boundary Supply Prima System": {
        pros: ["Highly modular system (pack + camera case + field space)", "Adaptable for travel/photo/EDC", "Robust build quality", "Comfortable harness", "Unique aesthetic", "Good weather resistance"],
        cons: ["Expensive (especially as a full system)", "Can be bulky/heavy", "Complexity requires learning curve", "Photo-centric design might compromise space for general items"]
    },
    "CabinZero Classic 36L": {
        pros: ["Very lightweight for its capacity", "Designed to meet most airline carry-on dimensions", "Simple boxy shape maximizes packing space", "Affordable", "Wide range of colors", "Built-in Okoban tracking tag"],
        cons: ["Minimal structure (can sag if not packed well)", "Basic harness system (not ideal for long heavy carries)", "Simple organization (mostly one large compartment)", "Basic materials"]
    },
    "Dagne Dover Dakota Backpack": {
        pros: ["Stylish, fashion-forward design (often neoprene)", "Excellent internal organization (laptop sleeve, shoe bag, water bottle pockets)", "Comfortable straps for moderate loads", "Multiple sizes and colors"],
        cons: ["Neoprene material isn't the most durable or weather resistant", "Requires care (can show dirt/pilling)", "Can be bulky/heavy for its volume", "Fashion focus over technical performance"]
    },
    "Dagne Dover Landon Carryall": {
        pros: ["Stylish weekender/gym bag", "Well-organized interior", "Includes shoe bag/pouches", "Multiple sizes/colors", "Neoprene material gives unique look/feel"],
        cons: ["Neoprene care/durability concerns", "Primarily a hand/shoulder carry bag (backpack straps, if included, are usually basic)", "Can be heavy"]
    },
    "Defy Bags Recon": {
        pros: ["Extremely durable construction (often ballistic Cordura, MIL-SPEC components, waxed canvas options)", "Rugged industrial/military aesthetic", "Often made in USA", "Comfortable straps for load", "Practical organization"],
        cons: ["Heavy even when empty", "High price point", "Stiff materials might require break-in", "Aesthetic isn't suitable for formal environments"]
    },
    "Deuter Giga 28": {
        pros: ["Very comfortable and well-ventilated Airstripes back system", "Excellent organization for school/work (laptop, folders, pens)", "Durable construction", "Good value proposition"],
        cons: ["Traditional 'bookbag' aesthetic isn't for everyone", "Can be slightly heavier than minimalist commuter packs"]
    },
    "Deuter Transit 50": {
        pros: ["Large capacity travel pack with stowable harness system", "Typically includes a detachable daypack for versatility", "Comfortable harness for carrying heavier travel loads", "Durable build quality"],
        cons: ["Large size (50L) often requires checking on flights", "Can get quite heavy when fully packed", "Detachable daypack adds weight/bulk if not needed"]
    },
    "DSPTCH Ruckpack": {
        pros: ["Robust build quality (ballistic nylon, Duraflex hardware)", "Blend of military and urban aesthetics", "Comfortable suspension system", "Good organization with dedicated laptop compartment", "Panel-loading access"],
        cons: ["Can be relatively heavy", "Premium price point", "Aesthetic is specific", "Might have less external quick access than some EDC packs"]
    },
    "Eagle Creek Global Companion 40L": {
        pros: ["Well-organized travel pack designed for carry-on", "Full book-style opening for easy packing", "Comfortable padded harness system", "Lockable zippers", "Durable materials", "Often includes rain cover pocket (cover sometimes separate)"],
        cons: ["Can be slightly heavier/bulkier than minimalist travel packs", "Aesthetic is functional travel gear (less sleek)", "Organization might feel prescriptive for some"]
    },
    "Eagle Creek Tour Travel Pack 40L": {
        pros: ["Often lighter weight than Global Companion", "Still travel-focused with clamshell/panel access", "Good organization", "Comfortable carry for its weight class", "Durable Eagle Creek construction"],
        cons: ["Harness system might be slightly less robust than Global Companion", "Aesthetic remains functional travel"]
    },
    "Eastpak Out Of Office": {
        pros: ["Simple, classic backpack design", "Includes a dedicated padded laptop compartment", "Generally affordable", "Durable main fabric for the price", "Wide range of colors/patterns"],
        cons: ["Basic comfort (straps/back panel have minimal padding/ventilation)", "Minimal organization beyond laptop sleeve and front pocket"]
    },
    "Eastpak Padded Pak'r": {
        pros: ["The quintessential simple backpack", "Iconic design", "Durable for its class (especially the main fabric)", "Affordable", "Huge variety of colors/patterns available"],
        cons: ["Very minimal organization (usually just one main compartment and front pocket)", "Very basic straps and back panel (minimal padding/comfort)"]
    },
    "eBags Professional Weekender": { // Assuming maps to Professional Slim Laptop Backpack
        pros: ["Excellent organization tailored for business travel (tech, clothes, documents)", "Converts between backpack/briefcase", "Passes through luggage handles", "Checkpoint-friendly laptop compartment (often)"],
        cons: ["Can be complex with many compartments", "Design can look bulky/corporate", "Harness comfort is functional rather than plush"]
    },
    "eBags TLS Mother Lode Weekender": { // Mapping for Convertible
        pros: ["Very popular travel backpack known for massive, organized capacity", "Full clamshell opening", "Expandable main compartment", "Durable construction", "Convertible carry (stowable straps)", "Great value (historically)"],
        cons: ["Easy to overpack due to size", "Can become very heavy and bulky", "May exceed carry-on limits when expanded", "Boxy shape", "Harness less comfy than hiking packs for heavy loads"]
    },
    "Fjallraven Kanken 17L": { // Mapping for Classic 16L?
        pros: ["Iconic and fashionable design", "Durable Vinylon F fabric (water resistant, develops patina)", "Wide U-shaped opening", "Simple and lightweight", "Included seat pad"],
        cons: ["Very basic thin shoulder straps", "Minimal padding/comfort", "No dedicated laptop sleeve", "Boxy"]
    },
    "Fjallraven Kanken 20": { // Mapping for Kanken Large 20L
        pros: ["Larger capacity than the classic Kånken", "Retains iconic design and wide opening", "Included seat pad"],
        cons: ["Still features the basic, thin shoulder straps and minimal back padding", "Less comfortable with heavy loads"]
    },
    "Gravel Explorer Mini": {
        pros: ["Likely designed as a compact travel daypack or personal item", "Potentially integrates with Gravel's toiletry/packing system", "Probably lightweight"],
        cons: ["Small capacity", "Likely basic features and harness system", "Specific utility might depend heavily on Gravel ecosystem"]
    },
    "Gravel Explorer Plus": {
        pros: ["Larger version, possibly suitable for EDC or short trips", "Likely integrates with Gravel system", "Potential for thoughtful travel-specific features"],
        cons: ["Features, durability, comfort relative to price are unknown without specifics", "May rely on Gravel accessories for full potential"]
    },
    "Greenroom136 Rainmaker": {
        pros: ["Extremely durable construction (often 1000D Cordura)", "Highly weather resistant (name implies focus)", "Utilitarian design with good organization", "Comfortable harness system for load carry", "Malaysian brand known for build quality"],
        cons: ["Can be heavy", "Utilitarian/slightly tactical aesthetic isn't for everyone", "Might be overbuilt for simple EDC", "International shipping/availability"]
    },
    "Incase EO Travel Backpack": {
        pros: ["Designed for tech-heavy travel", "Expandable main compartment", "Excellent protective laptop compartment (often checkpoint-friendly)", "Clamshell opening for easy packing", "Professional look"],
        cons: ["Can get bulky and heavy when fully packed", "Looks very much like a 'tech bag'", "Organization is very structured (less flexible)"]
    },
    "Incase Icon Backpack": {
        pros: ["Excellent organization specifically designed for tech gear (laptop, tablet, cables, accessories)", "Highly protective laptop compartment", "Comfortable harness system", "Durable construction", "Sleek urban aesthetic"],
        cons: ["Can be heavy and feel bulky even when not full", "Internal organization is very specific and might not suit all needs", "Premium price point"]
    },
    "Jack Wolfskin Berkeley": {
        pros: ["Classic, simple book-pack design reminiscent of older styles", "Durable materials (Snuggle Up suspension)", "Comfortable straps/back for its class", "Generally affordable", "Good for school/casual use"],
        cons: ["Very simple design and organization", "Retro look might not appeal to everyone"]
    },
    "Jack Wolfskin TRT 32 Pack": {
        pros: ["Designed for rugged travel and daily use ('Tough, Rough, Technical')", "Durable and water-repellent materials", "Stowable backpack straps", "Modular gear loops (MOLLE-like)", "Good internal organization including laptop sleeve"],
        cons: ["Can be slightly heavy due to robust features", "Technical/utilitarian look isn't for everyone", "Back ventilation might be average"]
    },
    "JanSport Right Pack": {
        pros: ["Signature suede leather bottom adds durability and classic style", "Durable Cordura or polyester main body", "Simple and reliable design", "Affordable", "Lifetime warranty (typically)"],
        cons: ["Basic comfort (minimal padding on straps/back)", "Minimal organization (one main, one front pocket, internal sleeve)", "Suede requires some care and isn't waterproof"]
    },
    "JanSport SuperBreak": {
        pros: ["Extremely affordable and widely available", "Lightweight", "Huge variety of colors and patterns", "The quintessential basic backpack design", "Lifetime warranty (typically)"],
        cons: ["Minimal padding on straps and back panel (uncomfortable with heavy loads)", "Minimal organization (one main compartment, one front pocket)", "Basic materials"]
    },
    "Lems Daypack": {
        pros: ["Likely features a simple, minimalist design", "Potentially lightweight materials", "Functional for basic everyday needs"],
        cons: ["Probably basic features and organization", "Harness system likely simple (comfort unknown)", "Durability unknown"]
    },
    "Lems Travel Pack": {
        pros: ["Likely designed with travel simplicity in mind", "Potentially carry-on sized", "Possibly lightweight materials"],
        cons: ["Features, organization, harness comfort for travel loads unknown", "Likely minimalist feature set"]
    },
    "Lowe Alpine AirZone Pro 30": {
        pros: ["Excellent AirZone back system provides superb ventilation and comfort", "Stable and adjustable harness for hiking", "Feature-rich for technical day hikes (pole attachments, hip belt pockets, hydration compatible, often rain cover)", "Durable build"],
        cons: ["Highly technical hiking aesthetic", "Features add weight compared to simpler packs", "Might be over-featured/complex for casual use", "Premium price for technical features"]
    },
    "Lowe Alpine AirZone Trail 35": {
        pros: ["Great ventilation via AirZone back panel", "Comfortable harness for day hikes or light overnights", "Good capacity", "Standard hiking features (pockets, hydration, pole loops, often rain cover)", "Durable Lowe Alpine quality"],
        cons: ["Definite hiker look", "Harness might be less robust than 'Pro' models for very heavy loads", "Slightly heavier than non-ventilated packs"]
    },
    "Mammut Seon Courier": {
        pros: ["Designed with separate 'Work' (padded laptop/tech) and 'Climb' (clothes/gear) compartments", "Clean urban aesthetic", "Durable materials", "Comfortable padded back panel"],
        cons: ["Boxy shape might feel bulky for some", "Specific organization concept might not suit everyone", "Top flap access might be less convenient than zippers for main compartment"]
    },
    "Mammut Xeron Flip 22": {
        pros: ["Lightweight and versatile daypack", "Comfortable carry system", "Durable materials typical of Mammut", "Often features Mammut heritage details (like founding year print)", "Good for hikes or daily use"],
        cons: ["Simpler organization compared to the Seon line", "More general purpose design"]
    },
    "Mission Workshop Fitzroy": {
        pros: ["Large capacity rucksack (40L)", "Extremely durable and weatherproof construction (often uses Dimension Polyant fabric)", "Comfortable harness for load", "Clean lines despite size", "Often made in USA", "Lifetime warranty"],
        cons: ["Very expensive", "Heavy", "Flap and buckle closure isn't quick access", "Internal organization is often simple (relies on main compartment)"]
    },
    "Mission Workshop Rhake": {
        pros: ["Unique design with roll-top main compartment and multiple purpose-built external pockets for organization (laptop, tablet, phone, cables, etc.)", "Highly weatherproof", "Extremely durable", "Arkiv modularity compatible"],
        cons: ["Very expensive", "Heavy", "Complex access and organization might take getting used to", "Harness prioritizes stability/weatherproofing over plushness"]
    },
    "Mission Workshop Vandal": {
        pros: ["Expandable roll-top design offers massive cargo capacity (29L to 65L)", "Extremely durable and weatherproof", "Comfortable harness for carrying significant weight", "Great for bike commuters or hauling large items"],
        cons: ["Very expensive", "Heavy even when compressed", "Can be very large and potentially unwieldy when fully expanded", "Primarily a cargo hauler with basic organization"]
    },
    "Mountain Hardwear Scrambler 35": {
        pros: ["Lightweight yet durable pack designed for climbing/alpine environments", "Streamlined design avoids snagging", "Comfortable carry for active use", "Top-loading access", "Often highly water-resistant materials"],
        cons: ["Minimalist organization (focus on main compartment)", "Top-access only isn't as convenient for general use", "Technical look", "Harness is minimal to save weight"]
    },
    "Mountainsmith Approach 25": {
        pros: ["Durable construction typical of Mountainsmith", "Comfortable harness system for day hiking", "Good value proposition", "Practical pocket layout for outdoor use (mesh side pockets, front pocket)"],
        cons: ["Traditional outdoor aesthetic", "Might be heavier than ultralight options", "Basic internal organization"]
    },
    "Mountainsmith Approach 35": {
        pros: ["Increased capacity for longer day hikes or light overnights", "Retains durable build and comfortable carry", "Good value", "Functional outdoor feature set"],
        cons: ["Outdoor aesthetic", "Harness might be less sophisticated than premium multi-day packs", "Weight"]
    },
    "Mystery Ranch Urban Assault 21": {
        pros: ["Signature 3-zip design allows rapid, wide access to main compartment", "Very durable construction (often 500D Cordura)", "Comfortable padded shoulder straps and back panel", "Integrated laptop sleeve"],
        cons: ["3-zip can make utilizing the very top/bottom awkward sometimes", "Internal organization is relatively simple beyond laptop sleeve", "Heavier than many EDC packs", "Distinct aesthetic"]
    },
    "Mystery Ranch Urban Assault 24": {
        pros: ["Larger capacity than the 21L version", "Retains iconic 3-zip access and durable build", "Comfortable carry", "Adds slightly more organization (e.g., extra internal pockets, external bottle pockets often)"],
        cons: ["Heavier and bulkier than 21L", "Still relatively simple internal organization compared to tech-focused bags", "Distinct aesthetic"]
    },
    "Nomad Lane Bento Bag Pro": {
        pros: ["Excellent organization specifically designed as an under-seat personal item for air travel", "Protects tech", "Includes charging port passthrough (battery not included)", "Trolley sleeve", "Converts from shoulder bag to backpack (basic straps)"],
        cons: ["Small capacity (designed as personal item, not main luggage)", "Expensive for its size", "Backpack straps are likely very basic for comfort"]
    },
    "Ortlieb Commuter Daypack City": {
        pros: ["Fully waterproof roll-top design with welded seams", "Extremely durable materials", "Comfortable padded back panel with ventilation channels (good for cycling)", "Often includes removable organizer/laptop sleeve", "Robust build quality"],
        cons: ["Roll-top access is slower than zippers", "Internal organization is otherwise minimal", "Functional/utilitarian aesthetic"]
    },
    "Ortlieb Velocity": {
        pros: ["Classic Ortlieb waterproof backpack (often messenger-style closure)", "Very durable and completely waterproof", "Simple large main compartment", "Stable for cycling"],
        cons: ["Minimal internal organization", "Basic back panel and strap padding (though newer versions might be improved)", "Utilitarian look", "Closure can be fiddly"]
    },
    "Peak Design Everyday Backpack 30L": {
        pros: ["Innovative MagLatch closure allows capacity adjustment", "Excellent side access to main compartment", "Brilliant FlexFold dividers for customizable organization (especially photo/tech)", "Weatherproof construction", "Capture Clip attachment points", "Premium build"],
        cons: ["Very expensive", "Heavy for its size", "Side access isn't ideal for all packing styles", "MagLatch takes practice", "Internal organization relies heavily on dividers"]
    },
    "Peak Design Everyday Backpack Zip 20L": {
        pros: ["Simpler zippered access compared to MagLatch version", "Cleaner aesthetic", "Retains customizable FlexFold divider (usually one)", "Weatherproof zippers and fabric", "Side access still possible", "Premium build"],
        cons: ["Expensive", "Less adaptable capacity than MagLatch version", "Single main compartment access via zip (less segmentation)"]
    },
    "Peak Design Everyday Sling 6L": {
        pros: ["Well-designed sling for carrying a small camera kit or EDC essentials", "Includes adjustable FlexFold divider", "Comfortable padded strap (can be configured for cross-body/waist)", "Quick access", "Weatherproof"],
        cons: ["Limited capacity", "Premium price for a sling", "Might feel bulky on smaller frames"]
    },
    "Peak Design Travel Backpack 45L": {
        pros: ["Highly versatile travel system", "Expands from 35L (int'l carry-on) to 45L (US carry-on) or compresses to 30L daypack mode", "Full back panel access", "Integrates seamlessly with PD packing cubes/camera cubes", "Stowable straps", "Weatherproof"],
        cons: ["Very expensive (especially with accessories)", "Heavy even when empty", "Harness comfort debated for very heavy loads compared to top hiking packs", "Complex feature set"]
    },
    "Peak Design Travel Backpack 65L": { // Hypothetical based on 45L
        pros: ["(Hypothetical) Massive capacity for gear hauling/long trips", "Likely retains features of 45L (back access, cube integration, durable build, stowable straps)"],
        cons: ["(Hypothetical) Would be very large and heavy", "Definitely checked luggage only", "Very expensive", "Harness system would need to be exceptionally robust for comfort at this size"]
    },
    "Peak Design Travel Duffel 65L": {
        pros: ["Huge capacity", "Exceptionally wide doctor's bag style opening via single long zipper", "Weatherproof and durable recycled nylon canvas", "Multiple carry options (hand, shoulder, removable backpack straps)", "Integrates with PD cubes"],
        cons: ["Heavy for a duffel", "Backpack straps offer basic comfort (not for long treks)", "Premium price", "Large size means checked luggage"]
    },
    "Red Oxx Metro Backpack": {
        pros: ["Extremely durable \"bombproof\" construction (1000D Cordura, heavy-duty zippers)", "Simple and functional design", "Made in USA", "Lifetime \"No Bull\" warranty", "Practical size for EDC or personal item"],
        cons: ["Very utilitarian/basic aesthetic", "Minimal internal organization (designed for pouches/cubes)", "No padding for back or laptop (unless added sleeve used)", "Can be relatively heavy for size"]
    },
    "REI Flash 22": {
        pros: ["Very lightweight and affordable minimalist daypack/summit pack", "Surprisingly comfortable breathable back panel and straps for its weight", "Packable (can stuff into lid)", "Hydration compatible", "Good for summit bids or travel day trips"],
        cons: ["Minimal structure and padding (not for heavy loads)", "Thin materials require some care (less abrasion resistant)", "Very basic features and organization"]
    },
    "REI Ruckpack 28": {
        pros: ["Versatile pack for travel/hiking crossover", "Panel-loading or full-zip access for easy packing", "Good organization including laptop sleeve", "Comfortable padded harness", "Often includes rain cover", "Great value"],
        cons: ["Can be slightly heavier than pure minimalist packs", "Functional outdoor aesthetic", "Harness less sophisticated than premium brands"]
    },
    "REI Trail 25": {
        pros: ["Excellent value hiking daypack", "Comfortable ventilated back panel", "Good pocket layout (main, top, front shove-it, side mesh)", "Durable enough for regular use", "Hydration compatible", "Often includes rain cover"],
        cons: ["Harness system is good but less adjustable/plush than premium brands", "Standard outdoor look", "Might lack specific features for non-hiking use"]
    },
    "REI Trail 40": {
        pros: ["Great value pack for overnight hikes or minimalist travel", "Comfortable ventilated back panel and supportive hip belt", "Good capacity and pocket layout", "Durable construction", "Often includes rain cover"],
        cons: ["Harness less sophisticated than premium multi-day packs for very heavy loads", "Outdoor aesthetic", "Can be slightly heavier than some competitors"]
    },
    "Tom Bihn Synik 30": {
        pros: ["Legendary Tom Bihn durability and build quality (often US-made)", "Clamshell opening for full access", "Excellent integrated laptop compartment", "Thoughtful external pocket organization for quick access", "Very comfortable edgeless harness system"],
        cons: ["Very expensive", "Design aesthetic is functional/utilitarian (polarizing)", "Specific internal layout relies on built-in pockets (less open space)", "Heavier than minimalist packs"]
    }
    // Add more mappings here if needed based on filenames vs user provided text
};

// Function to find the best match for pros/cons data
function getProsCons(backpackName) {
  // 1. Direct exact match first
  if (prosConsData[backpackName]) {
    // console.log(`Exact match found for: ${backpackName}`);
    return prosConsData[backpackName];
  }

  // 2. Handle known problematic variations explicitly
  const lowerName = backpackName.toLowerCase();
  if (lowerName.includes('cote&ciel') || lowerName.includes('côte&ciel')) {
    if (lowerName.includes('isar large')) {
      console.log(`Mapping ${backpackName} to "Cote & Ciel Isar Large"`);
      return prosConsData["Cote & Ciel Isar Large"];
    }
    if (lowerName.includes('nile')) {
      console.log(`Mapping ${backpackName} to "Cote & Ciel Nile"`);
      return prosConsData["Cote & Ciel Nile"];
    }
  }
  // --- Fjällräven Specific Mapping ---
  const normalizedFjallravenName = lowerName.replace('kånken', 'kanken').replace('fjällräven', 'fjallraven');
  if (normalizedFjallravenName.startsWith('fjallraven')) {
      if (normalizedFjallravenName.includes('kanken') && normalizedFjallravenName.includes('17')) { // Catches "17", "17l"
          console.log(`Mapping ${backpackName} to "Fjallraven Kanken 17"`);
          return prosConsData["Fjallraven Kanken 17"];
      }
      if (normalizedFjallravenName.includes('kanken') && normalizedFjallravenName.includes('20')) {
           console.log(`Mapping ${backpackName} to "Fjallraven Kanken 20"`);
           return prosConsData["Fjallraven Kanken 20"];
      }
      // Add mapping for Kanken 17L specifically if needed, but 17 check should cover it
      // if (normalizedFjallravenName.includes('kanken') && normalizedFjallravenName.includes('17l')) { ... }
      if (normalizedFjallravenName.includes('raven 28')) {
          console.log(`Mapping ${backpackName} to "Fjallraven Raven 28"`);
          return prosConsData["Fjallraven Raven 28"];
      }
  }
  // --- End Fjällräven Specific Mapping ---

  // --- Haglöfs Specific Mapping ---
    if (lowerName.includes('hagl') && lowerName.includes('tight pro large')) {
        console.log(`Mapping ${backpackName} to "Haglofs Tight Pro Large"`);
        return prosConsData["Haglofs Tight Pro Large"];
    }
     if (lowerName.includes('hagl') && lowerName.includes('vide medium')) {
        console.log(`Mapping ${backpackName} to "Haglofs Vide Medium"`);
        return prosConsData["Haglofs Vide Medium"];
    }
  // --- End Haglöfs Specific Mapping ---

  // 3. Try matching brand/general category (improved simple approach)
  const normalizedBackpackName = lowerName.replace(/[^a-z0-9]/gi, ''); // Simple normalization

  const brandMatchKey = Object.keys(prosConsData).find(key => {
    if (!key.startsWith('_') || !key.endsWith('General')) return false;
    const brandKey = key.substring(1, key.indexOf('General')).toLowerCase();
    // Check if backpack name *starts with* the brand key (more reliable than includes)
    return lowerName.startsWith(brandKey);
  });

  if (brandMatchKey) {
    console.log(`Using general ${brandMatchKey} data for ${backpackName}`);
    return prosConsData[brandMatchKey];
  }

  // 4. Fallback for tactical category
  if (lowerName.includes('gear') || lowerName.includes('military') || lowerName.includes('direct action')) {
      console.log(`Using general tactical data for ${backpackName}`);
      return prosConsData._tacticalGeneral;
  }


  console.warn(`No specific, mapped, or general pros/cons data found for: ${backpackName}`);
  return null; // No data found
}

// --- Main Script Logic ---
try {
  const files = fs.readdirSync(analysisDir)
    .filter(f => f.endsWith('.analysis.json') && f !== 'combined_analysis.json' && f !== 'summary.json'); // Exclude combined/summary

  console.log(`Found ${files.length} analysis files to process.`);
  let updatedCount = 0;
  let skippedCount = 0;

  for (const file of files) {
    const filePath = path.join(analysisDir, file);
    try {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const data = JSON.parse(fileContent);

      if (!data.name) {
        console.warn(`Skipping ${file}: Missing 'name' field.`);
        skippedCount++;
        continue;
      }

      const newProsCons = getProsCons(data.name);

      if (newProsCons) {
        // Update only pros and cons, keep other fields
        const updatedData = {
          ...data, // Spread existing data first
          pros: newProsCons.pros, // Overwrite pros
          cons: newProsCons.cons  // Overwrite cons
        };

        fs.writeFileSync(filePath, JSON.stringify(updatedData, null, 2));
        // console.log(`Updated pros/cons for: ${data.name} in ${file}`);
        updatedCount++;
      } else {
        // console.warn(`Skipping ${file}: No pros/cons data matched for name '${data.name}'`);
        skippedCount++;
      }

    } catch (readWriteError) {
      console.error(`Error processing file ${file}:`, readWriteError);
      skippedCount++;
    }
  }

  console.log(`Finished processing. Updated: ${updatedCount}, Skipped/No Match: ${skippedCount}`);

} catch (err) {
  console.error('Error reading analysis directory or processing files:', err);
} 