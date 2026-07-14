const DEFAULT_DIET_FLAGS = Object.freeze({
  vegan: "compatible",
  vegetarian: "compatible",
  glutenFree: "compatible"
});

const GROUPS = [
  {
    category: "plant oil",
    function: "fat / cooking oil",
    plainDescription: "A plant-derived oil used as a source of fat.",
    whyUsed: "Adds fat, texture, cooking performance, or mouthfeel.",
    nutritionRole: "Mainly contributes fat and calories.",
    tags: ["plant-derived", "oil", "fat"],
    entries: [
      "sunflower oil", "canola oil", "rapeseed oil", "soybean oil", "olive oil", "palm oil",
      "palm kernel oil", "coconut oil", "avocado oil", "peanut oil", "corn oil", "safflower oil",
      "cottonseed oil", "sesame oil", "rice bran oil", "grapeseed oil", "flaxseed oil", "walnut oil",
      "almond oil", "hazelnut oil", "pumpkin seed oil", "hemp seed oil", "mustard oil", "macadamia oil",
      "wheat germ oil", "hydrogenated oil"
    ]
  },
  {
    category: "animal fat",
    function: "fat / texture ingredient",
    plainDescription: "An animal-derived fat used in cooking or food texture.",
    whyUsed: "Adds richness, texture, flavor, or cooking performance.",
    nutritionRole: "Contributes fat and calories; the fatty-acid profile varies by source.",
    tags: ["animal-derived", "fat"],
    dietFlags: { vegan: "not_compatible", vegetarian: "not_compatible", glutenFree: "compatible" },
    entries: [
      "lard", "tallow", "beef fat", "chicken fat", "duck fat", "goose fat", "pork fat", "bacon fat",
      "milk fat", "butter oil", "anhydrous milk fat", "ghee", "suet"
    ]
  },
  {
    category: "grain",
    function: "grain base",
    plainDescription: "A grain ingredient used as a food base or source of starch.",
    whyUsed: "Provides bulk, texture, starch, flavor, or structure.",
    nutritionRole: "Mainly contributes carbohydrates and may contribute fiber or protein.",
    tags: ["grain", "carbohydrate"],
    entries: [
      "wheat", "whole wheat", "durum wheat", "spelt", "einkorn", "emmer", "kamut", "rice", "white rice",
      "brown rice", "wild rice", "oats", "rolled oats", "steel cut oats", "oat groats", "corn", "whole grain corn",
      "popcorn", "barley", "pearled barley", "rye", "millet", "sorghum", "quinoa", "buckwheat", "amaranth",
      "teff", "triticale", "bulgur", "couscous", "farro", "freekeh", "fonio"
    ]
  },
  {
    category: "grain flour",
    function: "base flour",
    plainDescription: "A milled flour used to provide structure, bulk, or starch.",
    whyUsed: "Builds structure and texture in baked or prepared foods.",
    nutritionRole: "Mainly contributes carbohydrates and may contribute protein or fiber.",
    tags: ["flour", "carbohydrate"],
    entries: [
      "wheat flour", "whole wheat flour", "durum wheat flour", "semolina", "rice flour", "brown rice flour",
      "oat flour", "corn flour", "cornmeal", "barley flour", "rye flour", "spelt flour", "buckwheat flour",
      "sorghum flour", "millet flour", "quinoa flour", "amaranth flour", "teff flour", "almond flour",
      "coconut flour", "chickpea flour", "tapioca flour", "cassava flour", "potato flour", "soy flour",
      "pea flour", "lentil flour", "fava bean flour", "hazelnut flour", "chestnut flour", "arrowroot flour",
      "banana flour", "plantain flour"
    ]
  },
  {
    category: "starch",
    function: "thickener / structure",
    plainDescription: "A carbohydrate ingredient used for thickening, binding, or structure.",
    whyUsed: "Controls thickness, moisture, crispness, or texture.",
    nutritionRole: "Primarily contributes carbohydrate when used in meaningful amounts.",
    tags: ["starch", "carbohydrate"],
    entries: [
      "corn starch", "potato starch", "tapioca starch", "rice starch", "wheat starch", "arrowroot starch",
      "cassava starch", "pea starch", "sweet potato starch", "mung bean starch", "sago starch", "modified food starch",
      "modified corn starch", "resistant starch", "pregelatinized starch", "maltodextrin"
    ]
  },
  {
    category: "sweetener",
    function: "sweetening / texture",
    plainDescription: "A caloric sweetening ingredient used in foods and drinks.",
    whyUsed: "Adds sweetness and can also affect moisture, browning, or texture.",
    nutritionRole: "Contributes carbohydrate and sugars; the product nutrition panel gives the relevant amount.",
    tags: ["sweetener", "carbohydrate"],
    entries: [
      "sugar", "cane sugar", "brown sugar", "powdered sugar", "raw sugar", "turbinado sugar", "demerara sugar",
      "muscovado sugar", "coconut sugar", "date sugar", "invert sugar", "dextrose", "glucose", "fructose",
      "lactose", "maltose", "trehalose", "corn syrup", "high fructose corn syrup", "rice syrup", "brown rice syrup",
      "maple syrup", "honey", "molasses", "blackstrap molasses", "agave syrup", "date syrup", "barley malt syrup",
      "tapioca syrup", "sorghum syrup", "golden syrup", "glucose syrup", "fruit juice concentrate",
      "apple juice concentrate", "grape juice concentrate", "pear juice concentrate", "pineapple juice concentrate",
      "evaporated cane juice", "malt extract"
    ]
  },
  {
    category: "dairy ingredient",
    function: "dairy base / texture",
    plainDescription: "A milk-derived ingredient used for flavor, protein, fat, or texture.",
    whyUsed: "Adds dairy flavor, body, protein, fat, moisture, or structure.",
    nutritionRole: "May contribute protein, fat, carbohydrate, calcium, or calories depending on the ingredient.",
    tags: ["animal-derived", "dairy", "milk-source"],
    dietFlags: { vegan: "not_compatible", vegetarian: "compatible", glutenFree: "compatible" },
    allergenSources: ["milk"],
    entries: [
      "milk", "whole milk", "skim milk", "nonfat milk", "lowfat milk", "milk powder", "skim milk powder",
      "whole milk powder", "evaporated milk", "condensed milk", "sweetened condensed milk", "whey", "whey powder",
      "whey protein", "whey protein concentrate", "whey protein isolate", "casein", "caseinate", "sodium caseinate",
      "calcium caseinate", "cream", "heavy cream", "sour cream", "butter", "buttermilk", "cheese", "cheddar cheese",
      "mozzarella cheese", "parmesan cheese", "cream cheese", "yogurt", "greek yogurt", "milk solids", "nonfat milk solids",
      "milk protein", "milk protein concentrate", "milk protein isolate", "lactose"
    ]
  },
  {
    category: "egg ingredient",
    function: "binding / structure",
    plainDescription: "An egg-derived ingredient used for structure, binding, richness, or emulsification.",
    whyUsed: "Helps bind, aerate, emulsify, or add color and richness.",
    nutritionRole: "May contribute protein, fat, and calories depending on the amount used.",
    tags: ["animal-derived", "egg-source"],
    dietFlags: { vegan: "not_compatible", vegetarian: "compatible", glutenFree: "compatible" },
    allergenSources: ["egg"],
    entries: ["egg", "whole egg", "egg whites", "egg yolk", "dried egg", "dried egg whites", "egg powder", "albumin", "ovalbumin"]
  },
  {
    category: "legume",
    function: "plant protein / food base",
    plainDescription: "A legume-derived food ingredient used for protein, starch, texture, or flavor.",
    whyUsed: "Provides plant protein, starch, body, or flavor.",
    nutritionRole: "May contribute protein, carbohydrates, fiber, and minerals.",
    tags: ["plant-derived", "legume", "protein"],
    entries: [
      "soybeans", "soy protein", "soy protein concentrate", "soy protein isolate", "textured soy protein", "pea protein",
      "pea protein concentrate", "pea protein isolate", "green peas", "yellow peas", "lentils", "red lentils", "green lentils",
      "chickpeas", "chickpea protein", "black beans", "kidney beans", "navy beans", "pinto beans", "white beans",
      "lima beans", "mung beans", "fava beans", "lupin", "lupin protein"
    ]
  },
  {
    category: "nut",
    function: "food base / flavor",
    plainDescription: "A nut-derived ingredient used for flavor, texture, protein, or fat.",
    whyUsed: "Adds flavor, texture, protein, or fat.",
    nutritionRole: "Often contributes fat, protein, fiber, and calories.",
    tags: ["plant-derived", "nut"],
    entries: [
      "peanuts", "peanut butter", "peanut flour", "almonds", "almond butter", "cashews", "cashew butter", "walnuts",
      "pecans", "pistachios", "hazelnuts", "hazelnut butter", "macadamia nuts", "brazil nuts", "pine nuts", "chestnuts",
      "mixed nuts", "nut butter"
    ]
  },
  {
    category: "seed",
    function: "food base / texture",
    plainDescription: "A seed-derived ingredient used for flavor, texture, protein, fat, or fiber.",
    whyUsed: "Adds texture, flavor, plant fat, protein, or fiber.",
    nutritionRole: "May contribute fat, protein, fiber, minerals, and calories.",
    tags: ["plant-derived", "seed"],
    entries: [
      "sesame seeds", "tahini", "chia seeds", "flaxseed", "ground flaxseed", "sunflower seeds", "pumpkin seeds",
      "hemp seeds", "poppy seeds", "mustard seeds", "fennel seeds", "caraway seeds", "coriander seeds", "cumin seeds",
      "watermelon seeds", "seed butter", "sunflower seed butter"
    ]
  },
  {
    category: "fruit ingredient",
    function: "fruit base / flavor",
    plainDescription: "A fruit-derived ingredient used for flavor, color, sweetness, moisture, or texture.",
    whyUsed: "Adds fruit flavor, color, sweetness, moisture, or body.",
    nutritionRole: "May contribute natural sugars, fiber, acids, vitamins, or minerals depending on processing and amount.",
    tags: ["plant-derived", "fruit"],
    entries: [
      "apple", "apple puree", "apple sauce", "apple powder", "banana", "banana puree", "strawberry", "strawberry puree",
      "blueberry", "blueberry puree", "raspberry", "blackberry", "cranberry", "cherry", "sour cherry", "peach", "pear",
      "pear puree", "apricot", "plum", "prune", "grape", "raisin", "date", "fig", "mango", "mango puree", "papaya",
      "pineapple", "pineapple juice", "orange", "orange juice", "orange juice concentrate", "lemon", "lemon juice",
      "lemon juice concentrate", "lime", "lime juice", "grapefruit", "passion fruit", "pomegranate", "watermelon", "coconut",
      "coconut milk", "coconut cream", "coconut water", "fruit puree", "dried fruit"
    ]
  },
  {
    category: "vegetable ingredient",
    function: "vegetable base / flavor",
    plainDescription: "A vegetable-derived ingredient used for flavor, color, moisture, texture, or bulk.",
    whyUsed: "Adds vegetable flavor, color, body, moisture, or structure.",
    nutritionRole: "May contribute carbohydrates, fiber, minerals, or micronutrients depending on processing and amount.",
    tags: ["plant-derived", "vegetable"],
    entries: [
      "onion", "onion powder", "dehydrated onion", "garlic", "garlic powder", "dehydrated garlic", "potato", "potato flakes",
      "sweet potato", "carrot", "carrot puree", "spinach", "kale", "broccoli", "cauliflower", "cabbage", "celery",
      "celery powder", "beet", "beet juice", "beet powder", "pumpkin", "pumpkin puree", "zucchini", "squash", "butternut squash",
      "bell pepper", "red bell pepper", "green bell pepper", "chili pepper", "jalapeno pepper", "mushroom", "mushroom powder",
      "cucumber", "lettuce", "artichoke", "asparagus", "green bean", "okra", "eggplant", "turnip", "parsnip", "radish",
      "leek", "scallion", "corn kernels", "vegetable puree", "vegetable powder"
    ]
  },
  {
    category: "tomato product",
    function: "fruit / vegetable base",
    plainDescription: "A tomato-derived ingredient used for flavor, color, acidity, or body.",
    whyUsed: "Adds tomato flavor, color, acidity, moisture, or thickness.",
    nutritionRole: "May contribute natural sugars, acidity, potassium, and small amounts of micronutrients.",
    tags: ["plant-derived", "tomato", "vegetable-base"],
    entries: ["tomatoes", "diced tomatoes", "crushed tomatoes", "tomato puree", "tomato paste", "tomato powder", "tomato pulp", "sun dried tomatoes"]
  },
  {
    category: "cocoa / chocolate ingredient",
    function: "flavor / fat / confectionery base",
    plainDescription: "A cocoa- or chocolate-derived ingredient used for flavor, color, fat, or texture.",
    whyUsed: "Adds chocolate flavor, color, richness, or structure.",
    nutritionRole: "May contribute fat, carbohydrates, fiber, minerals, sugar, and calories depending on formulation.",
    tags: ["cocoa", "chocolate"],
    entries: [
      "cocoa", "cocoa powder", "cocoa butter", "chocolate liquor", "cocoa mass", "unsweetened chocolate", "milk chocolate",
      "dark chocolate", "white chocolate", "chocolate chips", "chocolate chunks", "cocoa nibs", "alkalized cocoa", "chocolate coating"
    ]
  },
  {
    category: "acid",
    function: "acidity / flavor control",
    plainDescription: "An acidic ingredient used to adjust tartness, pH, flavor, or preservation conditions.",
    whyUsed: "Controls acidity, flavor balance, browning, or formulation stability.",
    nutritionRole: "Usually not a major nutrient contributor at typical formulation levels.",
    tags: ["acid", "acidity-regulator"],
    entries: [
      "citric acid", "acetic acid", "lactic acid", "malic acid", "tartaric acid", "phosphoric acid", "ascorbic acid",
      "fumaric acid", "gluconic acid", "succinic acid", "cream of tartar"
    ]
  },
  {
    category: "vinegar",
    function: "acid / flavoring",
    plainDescription: "A fermented acidic ingredient used for tartness, flavor, or preservation support.",
    whyUsed: "Adds acidity and flavor and can support preservation conditions.",
    nutritionRole: "Usually not a major nutrient contributor.",
    tags: ["vinegar", "acid"],
    entries: ["vinegar", "distilled vinegar", "apple cider vinegar", "white vinegar", "rice vinegar", "wine vinegar", "red wine vinegar", "balsamic vinegar", "malt vinegar"]
  },
  {
    category: "leavening agent",
    function: "leavening / pH control",
    plainDescription: "An ingredient used to create lift or control acidity in baked foods.",
    whyUsed: "Produces or supports gas formation for a lighter texture.",
    nutritionRole: "Usually not a major nutrient contributor, though some contribute sodium or minerals.",
    tags: ["leavening", "baking"],
    entries: [
      "baking soda", "baking powder", "yeast", "active dry yeast", "brewers yeast", "nutritional yeast", "monocalcium phosphate",
      "sodium acid pyrophosphate", "ammonium bicarbonate", "potassium bicarbonate", "calcium phosphate"
    ]
  },
  {
    category: "salt / mineral",
    function: "seasoning / mineral source",
    plainDescription: "A salt or mineral ingredient used for flavor, nutrition, texture, or processing.",
    whyUsed: "Adds seasoning, minerals, stability, or functional properties.",
    nutritionRole: "May contribute sodium or another mineral depending on the ingredient and amount.",
    tags: ["mineral"],
    entries: [
      "salt", "sea salt", "kosher salt", "potassium chloride", "calcium carbonate", "ferrous sulfate", "reduced iron",
      "zinc oxide", "zinc sulfate", "magnesium carbonate", "magnesium oxide", "calcium chloride", "magnesium chloride",
      "calcium citrate", "potassium citrate", "sodium citrate", "sodium phosphate", "disodium phosphate", "tripotassium phosphate",
      "iodized salt", "mineral salt"
    ]
  },
  {
    category: "vitamin",
    function: "vitamin fortification",
    plainDescription: "A vitamin ingredient added to provide or restore a labeled nutrient.",
    whyUsed: "Adds a specified vitamin or supports nutrient fortification.",
    nutritionRole: "Contributes the labeled vitamin when present in a meaningful amount.",
    tags: ["vitamin", "fortification"],
    entries: [
      "niacinamide", "niacin", "riboflavin", "thiamine mononitrate", "thiamine hydrochloride", "folic acid", "vitamin a palmitate",
      "vitamin d2", "vitamin d3", "vitamin e", "vitamin b6", "vitamin b12", "biotin", "pantothenic acid", "calcium pantothenate"
    ]
  },
  {
    category: "herb / spice",
    function: "seasoning / flavoring",
    plainDescription: "A culinary herb or spice used for flavor and aroma.",
    whyUsed: "Adds flavor, aroma, color, or heat.",
    nutritionRole: "Usually not a major nutrient contributor at seasoning amounts.",
    tags: ["seasoning", "herb", "spice"],
    entries: [
      "black pepper", "white pepper", "paprika", "smoked paprika", "cinnamon", "turmeric", "cumin", "oregano", "basil",
      "parsley", "rosemary", "thyme", "ginger", "nutmeg", "chili powder", "cayenne pepper", "cloves", "allspice",
      "cardamom", "coriander", "dill", "sage", "tarragon", "marjoram", "mint", "spearmint", "peppermint", "bay leaf",
      "saffron", "anise", "star anise", "fenugreek", "mustard powder", "garlic salt", "onion salt", "celery salt",
      "curry powder", "vanilla bean", "vanilla extract", "lemon peel", "orange peel"
    ]
  },
  {
    category: "fiber ingredient",
    function: "fiber / texture",
    plainDescription: "A fiber-rich ingredient used for texture, water binding, or added dietary fiber.",
    whyUsed: "Adds fiber, bulk, moisture control, or texture.",
    nutritionRole: "May contribute dietary fiber when present in a meaningful amount.",
    tags: ["fiber", "texture"],
    entries: [
      "oat fiber", "wheat fiber", "citrus fiber", "apple fiber", "pea fiber", "potato fiber", "bamboo fiber", "inulin",
      "chicory root fiber", "cellulose", "powdered cellulose", "soluble corn fiber", "acacia fiber", "psyllium husk",
      "beta glucan", "resistant dextrin"
    ]
  },
  {
    category: "protein ingredient",
    function: "protein / structure",
    plainDescription: "A concentrated protein ingredient used for nutrition, binding, or texture.",
    whyUsed: "Adds protein and can support structure, texture, or moisture control.",
    nutritionRole: "Contributes protein when present in a meaningful amount.",
    tags: ["protein"],
    entries: [
      "pea protein", "pea protein isolate", "soy protein", "soy protein isolate", "whey protein", "whey protein concentrate",
      "whey protein isolate", "milk protein concentrate", "milk protein isolate", "rice protein", "hemp protein", "potato protein",
      "egg white protein", "collagen", "gelatin", "vital wheat gluten", "hydrolyzed vegetable protein"
    ]
  },
  {
    category: "emulsifier / gum",
    function: "texture / mixing aid",
    plainDescription: "A texture ingredient used to mix, thicken, bind, or stabilize a formulation.",
    whyUsed: "Helps ingredients mix evenly and controls thickness or texture.",
    nutritionRole: "Usually not a major nutrient contributor at typical formulation levels.",
    tags: ["emulsifier", "stabilizer", "texture"],
    entries: [
      "soy lecithin", "sunflower lecithin", "lecithin", "mono and diglycerides", "xanthan gum", "guar gum", "locust bean gum",
      "gellan gum", "pectin", "agar", "gum arabic", "carboxymethylcellulose"
    ]
  },
  {
    category: "food base",
    function: "flavor / food base",
    plainDescription: "A recognizable food ingredient used as a base, flavor, or texture component.",
    whyUsed: "Adds flavor, body, moisture, or a familiar food component.",
    nutritionRole: "Its nutrient contribution depends on the ingredient and amount used.",
    tags: ["food-base"],
    entries: [
      "water", "broth", "vegetable broth", "chicken broth", "beef broth", "stock", "tomato sauce", "soy sauce", "tamari",
      "mustard", "mayonnaise", "ketchup", "peanut paste", "fruit pectin", "vanilla", "vanillin", "coffee", "tea", "instant coffee",
      "coconut cream powder", "apple cider", "rice protein", "corn protein", "almond milk"
    ]
  }
];

const SPECIAL = Object.freeze({
  "sunflower oil": { aliases: ["sunflower seed oil", "high oleic sunflower oil", "helianthus annuus seed oil"] },
  "olive oil": { aliases: ["extra virgin olive oil", "virgin olive oil"] },
  "canola oil": { aliases: ["canola seed oil"] },
  "wheat": { allergenSources: ["wheat"], tags: ["grain", "wheat-source", "gluten-source"], dietFlags: { glutenFree: "not_compatible" } },
  "whole wheat": { allergenSources: ["wheat"], tags: ["grain", "wheat-source", "gluten-source"], dietFlags: { glutenFree: "not_compatible" } },
  "durum wheat": { allergenSources: ["wheat"], tags: ["grain", "wheat-source", "gluten-source"], dietFlags: { glutenFree: "not_compatible" } },
  "wheat flour": { aliases: ["enriched wheat flour", "white wheat flour", "wheat flour enriched", "bleached wheat flour", "unbleached wheat flour", "enriched flour", "flour"], allergenSources: ["wheat"], tags: ["grain", "flour", "wheat-source", "gluten-source"], dietFlags: { glutenFree: "not_compatible" } },
  "whole wheat flour": { aliases: ["wholemeal wheat flour", "wholemeal flour"], allergenSources: ["wheat"], tags: ["grain", "flour", "wheat-source", "gluten-source"], dietFlags: { glutenFree: "not_compatible" } },
  "durum wheat flour": { allergenSources: ["wheat"], tags: ["grain", "flour", "wheat-source", "gluten-source"], dietFlags: { glutenFree: "not_compatible" } },
  "semolina": { aliases: ["durum semolina"], allergenSources: ["wheat"], tags: ["grain", "flour", "wheat-source", "gluten-source"], dietFlags: { glutenFree: "not_compatible" } },
  "wheat starch": { allergenSources: ["wheat"], tags: ["starch", "wheat-source"], dietFlags: { glutenFree: "unknown" } },
  "barley": { allergenSources: ["wheat"], tags: ["grain", "gluten-source"], dietFlags: { glutenFree: "not_compatible" } },
  "rye": { allergenSources: ["wheat"], tags: ["grain", "gluten-source"], dietFlags: { glutenFree: "not_compatible" } },
  "spelt": { allergenSources: ["wheat"], tags: ["grain", "wheat-source", "gluten-source"], dietFlags: { glutenFree: "not_compatible" } },
  "malt extract": { tags: ["sweetener", "barley-source", "gluten-source"], dietFlags: { glutenFree: "not_compatible" } },
  "salt": { aliases: ["sodium chloride", "table salt"], tags: ["mineral", "seasoning", "sodium-source"] },
  "sugar": { aliases: ["sucre", "azucar", "azúcar"], tags: ["sweetener", "carbohydrate"] },
  "baking soda": { aliases: ["sodium bicarbonate", "bicarbonate of soda"], tags: ["leavening", "sodium-source"] },
  "tomato puree": { aliases: ["tomato pulp", "tomato puree concentrate", "strained tomatoes"] },
  "apple puree": { aliases: ["apple purée"] },
  "soybeans": { aliases: ["soy beans", "soya beans"], allergenSources: ["soy"] },
  "soy protein": { aliases: ["soya protein"], allergenSources: ["soy"] },
  "soy lecithin": { aliases: ["lecithin from soy", "soya lecithin", "soybean lecithin"], allergenSources: ["soy"], tags: ["emulsifier", "soy-source"] },
  "peanuts": { aliases: ["peanut", "groundnuts"], allergenSources: ["peanut"] },
  "peanut butter": { allergenSources: ["peanut"] },
  "peanut flour": { allergenSources: ["peanut"] },
  "sesame seeds": { aliases: ["sesame seed"], allergenSources: ["sesame"] },
  "sesame oil": { allergenSources: ["sesame"] },
  "tahini": { aliases: ["sesame paste"], allergenSources: ["sesame"] },
  "almonds": { aliases: ["almond"], allergenSources: ["tree nuts"] },
  "almond butter": { allergenSources: ["tree nuts"] },
  "almond flour": { allergenSources: ["tree nuts"] },
  "cashews": { aliases: ["cashew"], allergenSources: ["tree nuts"] },
  "walnuts": { aliases: ["walnut"], allergenSources: ["tree nuts"] },
  "pecans": { aliases: ["pecan"], allergenSources: ["tree nuts"] },
  "pistachios": { aliases: ["pistachio"], allergenSources: ["tree nuts"] },
  "hazelnuts": { aliases: ["hazelnut", "filbert", "noisette", "noisettes"], allergenSources: ["tree nuts"] },
  "macadamia nuts": { aliases: ["macadamia"], allergenSources: ["tree nuts"] },
  "brazil nuts": { aliases: ["brazil nut"], allergenSources: ["tree nuts"] },
  "pine nuts": { aliases: ["pine nut", "pignoli"], allergenSources: ["tree nuts"] },
  "egg": { aliases: ["eggs"], allergenSources: ["egg"] },
  "milk": { aliases: ["dairy milk", "cows milk"], allergenSources: ["milk"] },
  "milk powder": { aliases: ["dried milk", "dry milk"], allergenSources: ["milk"] },
  "skim milk powder": { aliases: ["lait ecreme en poudre", "lait écrémé en poudre", "poudre de lait ecreme", "poudre de lait écrémé"], allergenSources: ["milk"] },
  "whey powder": { aliases: ["lactoserum en poudre", "lactoserum", "petit lait en poudre"], allergenSources: ["milk"] },
  "cocoa powder": { aliases: ["cacao maigre", "cacao maigre en poudre", "poudre de cacao maigre"], tags: ["cocoa", "chocolate"] },
  "modified food starch": { aliases: ["food starch modified"], tags: ["starch", "processing-marker"] },
  "modified corn starch": { aliases: ["modified maize starch"], tags: ["starch", "processing-marker"] },
  "maltodextrin": { tags: ["carbohydrate", "processing-marker"] },
  "hydrogenated oil": { aliases: ["hydrogenated vegetable oil", "fully hydrogenated oil"], tags: ["oil", "fat", "processing-marker"] },
  "pea protein isolate": { tags: ["protein", "processing-marker"] },
  "soy protein isolate": { aliases: ["isolated soy protein"], allergenSources: ["soy"], tags: ["protein", "soy-source", "processing-marker"] },
  "milk protein isolate": { allergenSources: ["milk"], tags: ["protein", "milk-source", "processing-marker"] },
  "whey protein": { allergenSources: ["milk"], tags: ["protein", "milk-source"] },
  "whey protein concentrate": { allergenSources: ["milk"], tags: ["protein", "milk-source"] },
  "whey protein isolate": { allergenSources: ["milk"], tags: ["protein", "milk-source", "processing-marker"] },
  "egg white protein": { allergenSources: ["egg"], tags: ["protein", "egg-source"] },
  "vital wheat gluten": { aliases: ["wheat gluten", "gluten flour"], allergenSources: ["wheat"], tags: ["protein", "wheat-source", "gluten-source"], dietFlags: { glutenFree: "not_compatible" } },
  "collagen": { dietFlags: { vegan: "not_compatible", vegetarian: "not_compatible", glutenFree: "compatible" }, tags: ["animal-derived", "protein", "processing-marker"] },
  "gelatin": { aliases: ["gelatine"], dietFlags: { vegan: "not_compatible", vegetarian: "not_compatible", glutenFree: "compatible" }, tags: ["animal-derived", "protein", "processing-marker"] },
  "mono and diglycerides": { aliases: ["mono- and diglycerides", "mono & diglycerides", "monoglycerides and diglycerides"], tags: ["emulsifier", "processing-marker"] },
  "carboxymethylcellulose": { aliases: ["cellulose gum", "cmc"], tags: ["stabilizer", "processing-marker"] },
  "almond milk": { aliases: ["almondmilk"], allergenSources: ["tree nuts"] },
  "vanillin": { aliases: ["vanilline"], tags: ["flavoring"] }
});

function titleCase(value) {
  return String(value || "").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function normalizeAtlasKey(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/flavours?/g, "flavor")
    .replace(/colours?/g, "color")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .toLowerCase();
}

function mergeDietFlags(base, override) {
  return { ...DEFAULT_DIET_FLAGS, ...(base || {}), ...(override || {}) };
}

function createRecord(group, canonicalName) {
  const special = SPECIAL[canonicalName] || {};
  const tags = [...new Set([...(group.tags || []), ...(special.tags || [])])];
  return Object.freeze({
    canonicalName,
    displayName: special.displayName || titleCase(canonicalName),
    aliases: [...new Set([canonicalName, ...(special.aliases || [])])],
    category: special.category || group.category,
    function: special.function || group.function,
    plainDescription: special.plainDescription || group.plainDescription,
    whyUsed: special.whyUsed || group.whyUsed,
    nutritionRole: special.nutritionRole || group.nutritionRole,
    defaultConcernLevel: special.defaultConcernLevel || "none",
    confidence: "common_ingredient",
    tags,
    dietFlags: mergeDietFlags(group.dietFlags, special.dietFlags),
    allergenSources: [...new Set(special.allergenSources || group.allergenSources || [])]
  });
}

const records = GROUPS.flatMap((group) => group.entries.map((name) => createRecord(group, name)));
const uniqueRecords = new Map(records.map((record) => [record.canonicalName, record]));

export const COMMON_INGREDIENT_ATLAS = Object.freeze([...uniqueRecords.values()]);

const ATLAS_ALIAS_INDEX = new Map();
for (const record of COMMON_INGREDIENT_ATLAS) {
  for (const alias of record.aliases) {
    const key = normalizeAtlasKey(alias);
    if (key && !ATLAS_ALIAS_INDEX.has(key)) ATLAS_ALIAS_INDEX.set(key, record);
  }
}

export function findCommonIngredient(value) {
  return ATLAS_ALIAS_INDEX.get(normalizeAtlasKey(value)) || null;
}

export function getCommonIngredientAtlasSize() {
  return COMMON_INGREDIENT_ATLAS.length;
}

export { normalizeAtlasKey };
