export interface ShowerScreenModel {
  id: string;
  name: string;
  tagline: string;
  category: "Frameless" | "Semi-Frameless" | "Sliding" | "Wardrobes";
  imageLabel: string;
  highlights: string[];
  summary: string;
  description: string[];
  features: string[];
  specs: {
    glass: string;
    frameFinishes: string;
    doorAction: string;
    dimensions: string;
    coating: string;
  };
  metaTitle: string;
  metaDesc: string;
}

export const SHOWER_SCREEN_MODELS: ShowerScreenModel[] = [
  {
    id: "frameless-pivot",
    name: "Bespoke Frameless Pivot & Hinged Screens",
    tagline: "Unobstructed Luxury & Timeless Architectural Elegance",
    category: "Frameless",
    imageLabel: "Frameless Pivot & Hinged Screen Image Placeholder",
    highlights: ["10mm Toughened Glass", "Pivot & Hinged Action", "Custom Frosted / Low-Iron", "Melbourne Crafted"],
    summary:
      "Engineered from heavy-duty 10mm toughened safety glass with heavy-duty brass hinges for a seamless, floating aesthetic.",
    description: [
      "Bespoke Frameless Pivot and Hinged Screens represent the gold standard in modern bathroom design, offering minimalist luxury without structural compromise. Crafted locally in Melbourne using 10mm clear toughened safety glass, these screens deliver exceptional rigidity, safety, and uninterrupted light flow.",
      "The precision pivot or hinged door configuration provides effortless access while maintaining sleek architectural lines. Customize your screen with low-iron ultra-clear glass or privacy-enhancing frosted finishes, complemented by your choice of premium hardware finishes to seamlessly match your bathroom fixtures.",
      "Each unit is custom-manufactured following a precise on-site measurement. For enduring clarity, enhance your glass with the optional Nano4-Glass ceramic coating to repel water spots, soap scum, and mineral buildup.",
    ],
    features: [
      "10mm premium Australian-standard clear toughened safety glass",
      "Precision pivot or heavy-duty hinged door mechanisms for smooth entry",
      "Frosted, low-iron ultra-clear, or patterned glass choices for privacy control",
      "Designer hardware options: Chrome, Matte Black, Brushed Brass, and Satin",
      "Easy-to-clean smooth glass surfaces for effortless upkeep",
      "Optional Nano4-Glass ceramic protective coating for stain resistance",
    ],
    specs: {
      glass: "10mm Clear Toughened Safety Glass (Optional Frosted or Low-Iron)",
      frameFinishes: "Frameless with Chrome, Matte Black, Brushed Gold & Satin Hardware",
      doorAction: "Pivot or Heavy-Duty Hinged Door Entry",
      dimensions: "Custom On-Site Measurement & Custom Fabrication",
      coating: "Optional Nano4-Glass Ceramic Protective Shield",
    },
    metaTitle: "Bespoke Frameless Pivot & Hinged Shower Screens Victoria | Groutix",
    metaDesc: "Custom 10mm frameless pivot and hinged shower screens made in Melbourne. Precision on-site laser measurements and premium hardware finishes. Request a free quote.",
  },
  {
    id: "frameless-slider",
    name: "Bespoke Frameless Sliding Screens",
    tagline: "Contemporary Space-Saving Innovation & Smooth Gliding Performance",
    category: "Sliding",
    imageLabel: "Frameless Sliding Screen Image Placeholder",
    highlights: ["10mm Toughened Glass", "Space-Saving Glide", "Heavy-Duty Rollers", "Minimalist Profile"],
    summary:
      "Combines space-efficient sliding door operation with 10mm frameless glass luxury for compact or modern master bathrooms.",
    description: [
      "Redefine modern bathroom layouts with Bespoke Frameless Sliding Screens. Expertly engineered for space efficiency and modern elegance, these sliding enclosures maximize usable bathroom space by eliminating outward door swing constraints.",
      "Built with heavy-duty 10mm toughened safety glass and precision stainless steel roller assemblies, the sliding mechanism delivers whisper-quiet operation and robust structural stability. Choose frosted or low-iron glass options to tailor privacy and ambient light.",
      "Custom-crafted to your exact enclosure dimensions after a professional on-site laser measurement. Elevate your glass durability with our optional Nano4-Glass protective shield for easy cleaning.",
    ],
    features: [
      "10mm heavy-duty toughened safety glass engineered for high stability",
      "Smooth-gliding sliding system designed for compact or luxury layouts",
      "Custom frosted or low-iron glass choices to balance light and privacy",
      "Selection of custom roller and track hardware finishes",
      "Precision-measured on-site for a guaranteed watertight fit",
      "Optional Nano4-Glass ceramic protective shield for water-repelling ease",
    ],
    specs: {
      glass: "10mm Clear Toughened Safety Glass (Optional Frosted/Low-Iron)",
      frameFinishes: "Minimalist Tracks in Bright Silver, Matte Black & Brushed Gold",
      doorAction: "Smooth Stainless Steel Sliding Roller System",
      dimensions: "Custom Tailored Up to 2.2M Heights",
      coating: "Optional Nano4-Glass Ceramic Coating Available",
    },
    metaTitle: "Bespoke Frameless Sliding Shower Screens Victoria | Groutix",
    metaDesc: "Space-saving 10mm frameless sliding shower screens with smooth-gliding roller assemblies. Custom-manufactured in Melbourne. Get a free quote today.",
  },
  {
    id: "neptune-series",
    name: "Neptune Semi-Frameless Series",
    tagline: "Cornerless Modern Aesthetics & Flexible Door Configurations",
    category: "Semi-Frameless",
    imageLabel: "Neptune Series Screen Image Placeholder",
    highlights: ["6mm Toughened Glass", "Cornerless Design", "Inward/Outward Swing", "Custom Dimensions"],
    summary:
      "Features an innovative cornerless glass-to-glass join with no vertical frame, creating an open, spacious bathroom ambience.",
    description: [
      "The Neptune Semi-Frameless Series elevates bathroom spaces through clean lines and clever architectural engineering. Designed without vertical frames where glass panels meet, Neptune achieves a seamless, cornerless appearance that maximizes light and spatial open feel.",
      "Manufactured with 6mm Australian-standard toughened glass, Neptune offers ultimate versatility with inward, outward, or centered door configurations to suit any shower layout. Select from clear or obscured cathedral glass alongside a wide array of frame colors.",
      "Assembled by skilled technicians using state-of-the-art mobile units, Neptune delivers quick installation turnarounds backed by optional Nano4-Glass ceramic protection.",
    ],
    features: [
      "6mm Australian safety toughened glass (or 5mm obscured cathedral glass)",
      "Cornerless design without vertical frame joints at glass meets",
      "Versatile door swing: Inward opening, outward opening, or centered door alignment",
      "Customizable dimensions: Up to 2.2m high x 2.0m wide (plus 2m return)",
      "Frame finishes: Bright Silver, Pearl, White, Barley, Bright Gold & Matte Black",
      "Optional Nano4-Glass ceramic coating for easier cleaning",
    ],
    specs: {
      glass: "6mm Clear Toughened Glass or 5mm Obscured Cathedral Glass",
      frameFinishes: "Bright Silver, Pearl, White, Barley, Gold & Black",
      doorAction: "Inward, Outward or Centered Door Configurations",
      dimensions: "Customizable up to 2.2M Height x 2.0M Width",
      coating: "Optional Nano4-Glass Ceramic Protection",
    },
    metaTitle: "Neptune Semi-Frameless Shower Screens | Groutix",
    metaDesc: "Neptune semi-frameless shower screens with cornerless glass design and versatile inward/outward door swings. Custom dimensions across Victoria.",
  },
  {
    id: "swiftcloset-wardrobes",
    name: "SwiftCloset Wardrobe Systems",
    tagline: "Fast 5-10 Day Turnaround & Customizable Sliding Robe Doors",
    category: "Wardrobes",
    imageLabel: "SwiftCloset Wardrobe System Image Placeholder",
    highlights: ["5-10 Day Express Turnaround", "Mirror & Glass Inserts", "Cavity & Built-in Fit", "Sleek Frame Colors"],
    summary:
      "Versatile wardrobe sliding door systems designed for quick installation with mirror, back-painted glass, or timber inserts.",
    description: [
      "Extend your interior upgrades beyond the shower with SwiftCloset Wardrobe Systems. Designed for seamless integration into built-in and cavity wardrobe spaces, SwiftCloset combines rapid manufacturing turnarounds with versatile customization.",
      "Enjoy a fast 5 to 10 business day turnaround without compromising quality. Personalize your robe doors with your choice of insert materials—including full-length safety mirrors, modern painted glass, laminated board, or paint-ready plaster.",
      "Complemented by durable aluminum frames in classic and modern tones, SwiftCloset brings effortless organization and modern style to bedrooms and hallway storage.",
    ],
    features: [
      "Express 5 to 10 business day turnaround for quick installation",
      "Seamless compatibility with built-in and cavity wardrobe openings",
      "Multiple insert options: Safety Mirror, Toughened Glass, Laminated Board & Plaster",
      "Stylish frame palette: White, Barley, White Birch, Matte Black, Bright & Matte Silver",
      "Trouble-free sliding track assembly engineered for long-term daily use",
    ],
    specs: {
      glass: "Safety Mirror, Back-Painted Glass, Laminated Board or Plaster",
      frameFinishes: "White, Barley, White Birch, Matte Black, Bright & Matte Silver",
      doorAction: "Smooth Bottom-Rolling Track System",
      dimensions: "Custom Sized to Fit Inbuilt Robe Cavities",
      coating: "N/A (Durable Anodised / Powder-Coated Aluminium)",
    },
    metaTitle: "SwiftCloset Wardrobe Sliding Doors | Groutix",
    metaDesc: "SwiftCloset wardrobe sliding doors with 5-10 day turnaround. Mirror, glass, board, and plaster inserts with custom aluminium frames.",
  },
  {
    id: "optima-series",
    name: "Optima Semi-Frameless Series",
    tagline: "Watertight Magnetic Seals & Robust Family-Proof Construction",
    category: "Semi-Frameless",
    imageLabel: "Optima Series Screen Image Placeholder",
    highlights: ["6mm Toughened Front", "6.38mm Laminated Sides", "Magnetic Door Closure", "Splash Deflector"],
    summary:
      "Built for active family bathrooms with full-length magnetic door closures and translucent splash deflectors to prevent water leakage.",
    description: [
      "Optima Shower Screens bring together heavy-duty glass construction, watertight sealing technology, and classic semi-frameless style. Designed to withstand daily family use, Optima provides a secure barrier that keeps water inside the shower enclosure.",
      "Featuring 6mm clear toughened front glass paired with 6.38mm clear laminated safety glass side panels, Optima combines optical transparency with maximum impact resistance. The magnetic door latch and bottom translucent spray flap guarantee a watertight seal.",
      "Available in standard 1850mm and 1950mm heights in White, Matte Black, or Silver frames, Optima offers exceptional durability and easy maintenance.",
    ],
    features: [
      "6mm clear toughened front safety glass + 6.38mm laminated safety glass sides",
      "Continuous magnetic door closure for a secure, watertight seal",
      "Translucent spray flap with splash deflector on pivoting door",
      "Semi-frameless layout for unobstructed forward visibility",
      "Standard height options: 1850mm and 1950mm with wide width options (740mm–1820mm)",
      "Optional Nano4-Glass ceramic coating to shield glass against limescale",
    ],
    specs: {
      glass: "6mm Clear Toughened Front + 6.38mm Clear Laminated Side Panels",
      frameFinishes: "White, Matte Black & Silver Powder-Coated Aluminium",
      doorAction: "Pivoting Door with Magnetic Latch & Splash Deflector",
      dimensions: "1850mm or 1950mm Heights (740mm to 1820mm Widths)",
      coating: "Optional Nano4-Glass Ceramic Protection",
    },
    metaTitle: "Optima Semi-Frameless Shower Screens | Groutix",
    metaDesc: "Watertight Optima semi-frameless shower screens featuring magnetic door closures, 6mm toughened glass, and splash deflectors.",
  },
  {
    id: "momentum-series",
    name: "Momentum Sliding Series",
    tagline: "Ultra-Slim Frame Profile & Overlapping Watertight Sliding Doors",
    category: "Sliding",
    imageLabel: "Momentum Series Screen Image Placeholder",
    highlights: ["Ultra-Slim Frame", "Overlapping Glass", "6mm Toughened Glass", "Standard 2000mm Height"],
    summary:
      "Minimalist sliding screen with an ultra-narrow frame profile and overlapping magnetic glass doors for an uncluttered look.",
    description: [
      "The Momentum Series delivers the refined look of a frameless screen alongside the effortless sliding functionality of a framed enclosure. Its ultra-slim frame profile adds modern sophistication to any bathroom space.",
      "Featuring 6mm toughened safety glass and magnetic door seals with overlapping glass alignment, Momentum creates a tight seal against water spillage. The smooth glass surfaces resist soap scum and water spots for easy cleaning.",
      "Choose a standard 2000mm height or request a custom height fit. Available in Chrome, Matte Black, White, and Gold frame accents.",
    ],
    features: [
      "Ultra-slim frame design for an uncluttered, modern bathroom aesthetic",
      "Overlapping glass panels with magnetic closure for watertight protection",
      "6mm toughened safety glass construction for durability and safety",
      "Standard 2000mm height or tailored custom heights",
      "Frame finishes: Chrome, White, Matte Black, and Gold",
      "Optional Nano4-Glass ceramic protective coating for low maintenance",
    ],
    specs: {
      glass: "6mm Clear Toughened Safety Glass",
      frameFinishes: "Chrome, White, Matte Black & Gold Slim Aluminium",
      doorAction: "Sliding Door with Overlapping Magnetic Seals",
      dimensions: "Standard 2000mm Height or Custom Made Heights",
      coating: "Optional Nano4-Glass Ceramic Shield Available",
    },
    metaTitle: "Momentum Sliding Shower Screens | Groutix",
    metaDesc: "Momentum ultra-slim sliding shower screens with overlapping magnetic doors and 6mm toughened safety glass. Custom heights available.",
  },
];

export function getModelById(id: string): ShowerScreenModel | undefined {
  return SHOWER_SCREEN_MODELS.find((m) => m.id === id);
}
