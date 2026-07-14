function aliasRecord({ canonicalName, displayName, aliases }) {
  return Object.freeze({
    canonicalName,
    displayName,
    aliases: Object.freeze(
      Object.entries(aliases).flatMap(([language, values]) =>
        values.map((value) => Object.freeze({ value, language }))
      )
    )
  });
}

// This map intentionally covers label terms that can be translated without
// changing their chemical or ingredient identity. Ambiguous phrases stay in
// the vague-term atlas instead of being expanded here.
export const MULTILINGUAL_INGREDIENT_ALIASES = Object.freeze([
  aliasRecord({ canonicalName: "hazelnuts", displayName: "Hazelnuts", aliases: { en: ["hazelnuts", "hazelnut"], fr: ["noisettes", "noisette"], es: ["avellanas", "avellana"], ar: ["بندق"] } }),
  aliasRecord({ canonicalName: "whey powder", displayName: "Whey Powder", aliases: { en: ["whey powder"], fr: ["lactosérum en poudre", "lactoserum en poudre", "poudre de lactosérum", "poudre de lactoserum", "petit-lait en poudre"], es: ["suero de leche en polvo"] } }),
  aliasRecord({ canonicalName: "whey", displayName: "Whey", aliases: { en: ["whey"], fr: ["lactosérum", "lactoserum", "petit-lait"], es: ["suero de leche"] } }),
  aliasRecord({ canonicalName: "skim milk powder", displayName: "Skim Milk Powder", aliases: { en: ["skim milk powder"], fr: ["lait écrémé en poudre", "lait ecreme en poudre", "poudre de lait écrémé", "poudre de lait ecreme"], es: ["leche desnatada en polvo", "leche descremada en polvo"] } }),
  aliasRecord({ canonicalName: "milk powder", displayName: "Milk Powder", aliases: { en: ["milk powder"], fr: ["lait en poudre", "poudre de lait"], es: ["leche en polvo"], ar: ["حليب مجفف", "حليب مسحوق"] } }),
  aliasRecord({ canonicalName: "emulsifiers", displayName: "Emulsifiers", aliases: { en: ["emulsifier", "emulsifiers", "emulsifying agents"], fr: ["émulsifiant", "emulsifiant", "émulsifiants", "emulsifiants"], es: ["emulsionante", "emulsionantes"] } }),
  aliasRecord({ canonicalName: "lecithins", displayName: "Lecithins", aliases: { en: ["lecithin", "lecithins"], fr: ["lécithine", "lecithine", "lécithines", "lecithines"], es: ["lecitina", "lecitinas"] } }),
  aliasRecord({ canonicalName: "soybeans", displayName: "Soy", aliases: { en: ["soy", "soya", "soybean"], fr: ["soja"], es: ["soja", "soya"] } }),
  aliasRecord({ canonicalName: "soy lecithin", displayName: "Soy Lecithin", aliases: { en: ["soy lecithin", "soya lecithin", "soybean lecithin"], fr: ["lécithine de soja", "lecithine de soja", "lécithines de soja", "lecithines de soja"], es: ["lecitina de soja", "lecitina de soya"] } }),
  aliasRecord({ canonicalName: "sunflower lecithin", displayName: "Sunflower Lecithin", aliases: { en: ["sunflower lecithin"], fr: ["lécithine de tournesol", "lecithine de tournesol", "lécithines de tournesol", "lecithines de tournesol"], es: ["lecitina de girasol"] } }),
  aliasRecord({ canonicalName: "vanillin", displayName: "Vanillin", aliases: { en: ["vanillin"], fr: ["vanilline"], es: ["vainillina"] } }),
  aliasRecord({ canonicalName: "sugar", displayName: "Sugar", aliases: { en: ["sugar"], fr: ["sucre"], es: ["azúcar", "azucar"], ar: ["سكر"] } }),
  aliasRecord({ canonicalName: "salt", displayName: "Salt", aliases: { en: ["salt"], fr: ["sel"], es: ["sal"], ar: ["ملح"] } }),
  aliasRecord({ canonicalName: "palm oil", displayName: "Palm Oil", aliases: { en: ["palm oil"], fr: ["huile de palme"], es: ["aceite de palma"], ar: ["زيت النخيل"] } }),
  aliasRecord({ canonicalName: "sunflower oil", displayName: "Sunflower Oil", aliases: { en: ["sunflower oil"], fr: ["huile de tournesol"], es: ["aceite de girasol"] } }),
  aliasRecord({ canonicalName: "canola oil", displayName: "Canola Oil", aliases: { en: ["canola oil", "rapeseed oil"], fr: ["huile de colza"], es: ["aceite de canola", "aceite de colza"] } }),
  aliasRecord({ canonicalName: "olive oil", displayName: "Olive Oil", aliases: { en: ["olive oil"], fr: ["huile d'olive", "huile d’olive"], es: ["aceite de oliva"] } }),
  aliasRecord({ canonicalName: "soybean oil", displayName: "Soybean Oil", aliases: { en: ["soybean oil", "soy oil"], fr: ["huile de soja"], es: ["aceite de soja", "aceite de soya"] } }),
  aliasRecord({ canonicalName: "cocoa powder", displayName: "Cocoa Powder", aliases: { en: ["cocoa powder", "low-fat cocoa powder"], fr: ["cacao maigre", "cacao maigre en poudre", "poudre de cacao maigre"], es: ["cacao en polvo", "cacao desgrasado en polvo"] } }),
  aliasRecord({ canonicalName: "cocoa", displayName: "Cocoa", aliases: { en: ["cocoa"], fr: ["cacao"], es: ["cacao"] } }),
  aliasRecord({ canonicalName: "chocolate liquor", displayName: "Chocolate Liquor", aliases: { en: ["chocolate liquor", "cocoa paste", "cocoa mass"], fr: ["pâte de cacao", "pate de cacao", "masse de cacao"], es: ["pasta de cacao", "masa de cacao"] } }),
  aliasRecord({ canonicalName: "cocoa butter", displayName: "Cocoa Butter", aliases: { en: ["cocoa butter"], fr: ["beurre de cacao"], es: ["manteca de cacao"] } }),
  aliasRecord({ canonicalName: "wheat flour", displayName: "Wheat Flour", aliases: { en: ["wheat flour", "enriched wheat flour"], fr: ["farine de blé", "farine de ble", "farine de blé enrichie", "farine de ble enrichie"], es: ["harina de trigo"], ar: ["دقيق القمح", "طحين القمح"] } }),
  aliasRecord({ canonicalName: "corn starch", displayName: "Corn Starch", aliases: { en: ["corn starch", "maize starch"], fr: ["amidon de maïs", "amidon de mais"], es: ["almidón de maíz", "almidon de maiz"] } }),
  aliasRecord({ canonicalName: "glucose syrup", displayName: "Glucose Syrup", aliases: { en: ["glucose syrup"], fr: ["sirop de glucose"], es: ["jarabe de glucosa"] } }),
  aliasRecord({ canonicalName: "high fructose corn syrup", displayName: "Glucose-Fructose Syrup", aliases: { en: ["glucose-fructose syrup", "high fructose corn syrup"], fr: ["sirop de glucose-fructose"], es: ["jarabe de glucosa-fructosa", "jarabe de maíz de alta fructosa"] } }),
  aliasRecord({ canonicalName: "natural flavor", displayName: "Natural Flavor", aliases: { en: ["natural flavor", "natural flavors"], fr: ["arôme naturel", "arome naturel", "arômes naturels", "aromes naturels"], es: ["sabor natural", "sabores naturales", "aroma natural", "aromas naturales"], ar: ["نكهة طبيعية", "نكهات طبيعية"] } }),
  aliasRecord({ canonicalName: "flavoring", displayName: "Flavoring", aliases: { en: ["flavoring", "flavorings", "flavor"], fr: ["arôme", "arome", "arômes", "aromes"], es: ["aroma", "aromas", "saborizante", "saborizantes"], ar: ["نكهة", "منكهات"] } }),
  aliasRecord({ canonicalName: "spices", displayName: "Spices", aliases: { en: ["spices"], fr: ["épices", "epices"], es: ["especias"] } }),
  aliasRecord({ canonicalName: "yeast", displayName: "Yeast", aliases: { en: ["yeast"], fr: ["levure"], es: ["levadura"] } }),
  aliasRecord({ canonicalName: "baking soda", displayName: "Baking Soda", aliases: { en: ["baking soda", "sodium bicarbonate"], fr: ["bicarbonate de sodium"], es: ["bicarbonato de sodio"] } }),
  aliasRecord({ canonicalName: "citric acid", displayName: "Citric Acid", aliases: { en: ["citric acid"], fr: ["acide citrique"], es: ["ácido cítrico", "acido citrico"] } }),
  aliasRecord({ canonicalName: "vinegar", displayName: "Vinegar", aliases: { en: ["vinegar"], fr: ["vinaigre"], es: ["vinagre"] } }),
  aliasRecord({ canonicalName: "milk protein", displayName: "Milk Protein", aliases: { en: ["milk protein", "milk proteins"], fr: ["protéines de lait", "proteines de lait"], es: ["proteínas de leche", "proteinas de leche"] } }),
  aliasRecord({ canonicalName: "soy protein", displayName: "Soy Protein", aliases: { en: ["soy protein", "soya protein"], fr: ["protéines de soja", "proteines de soja"], es: ["proteína de soja", "proteina de soja"] } }),
  aliasRecord({ canonicalName: "dietary fiber", displayName: "Dietary Fiber", aliases: { en: ["dietary fiber", "dietary fibre"], fr: ["fibres alimentaires", "fibre alimentaire"], es: ["fibra alimentaria", "fibra dietética", "fibra dietetica"] } }),
  aliasRecord({ canonicalName: "xanthan gum", displayName: "Xanthan Gum", aliases: { en: ["xanthan gum"], fr: ["gomme xanthane"], es: ["goma xantana"] } }),
  aliasRecord({ canonicalName: "guar gum", displayName: "Guar Gum", aliases: { en: ["guar gum"], fr: ["gomme guar"], es: ["goma guar"] } }),
  aliasRecord({ canonicalName: "pectin", displayName: "Pectin", aliases: { en: ["pectin"], fr: ["pectine"], es: ["pectina"] } }),
  aliasRecord({ canonicalName: "gelatin", displayName: "Gelatin", aliases: { en: ["gelatin", "gelatine"], fr: ["gélatine", "gelatine"], es: ["gelatina"] } }),
  aliasRecord({ canonicalName: "sesame seeds", displayName: "Sesame Seeds", aliases: { en: ["sesame", "sesame seeds"], fr: ["sésame", "sesame", "graines de sésame", "graines de sesame"], es: ["sésamo", "sesamo", "semillas de sésamo"] } }),
  aliasRecord({ canonicalName: "peanuts", displayName: "Peanuts", aliases: { en: ["peanuts", "peanut"], fr: ["arachides", "arachide", "cacahuètes", "cacahuetes"], es: ["cacahuetes", "cacahuates", "maní", "mani"] } }),
  aliasRecord({ canonicalName: "almonds", displayName: "Almonds", aliases: { en: ["almonds", "almond"], fr: ["amandes", "amande"], es: ["almendras", "almendra"] } }),
  aliasRecord({ canonicalName: "cashews", displayName: "Cashews", aliases: { en: ["cashews", "cashew"], fr: ["noix de cajou"], es: ["anacardos", "nueces de la india"] } }),
  aliasRecord({ canonicalName: "tree nuts", displayName: "Tree Nuts", aliases: { en: ["tree nuts", "nuts"], fr: ["noix"], es: ["frutos secos"] } }),
  aliasRecord({ canonicalName: "egg", displayName: "Egg", aliases: { en: ["egg", "eggs"], fr: ["œufs", "oeufs", "oeuf"], es: ["huevo", "huevos"] } }),
  aliasRecord({ canonicalName: "egg whites", displayName: "Egg White", aliases: { en: ["egg white", "egg whites"], fr: ["blanc d'œuf", "blanc d'oeuf", "blancs d'œufs", "blancs d'oeufs"], es: ["clara de huevo", "claras de huevo"] } }),
  aliasRecord({ canonicalName: "egg yolk", displayName: "Egg Yolk", aliases: { en: ["egg yolk", "egg yolks"], fr: ["jaune d'œuf", "jaune d'oeuf", "jaunes d'œufs", "jaunes d'oeufs"], es: ["yema de huevo", "yemas de huevo"] } })
]);
