const ICON_BASE = `${import.meta.env.BASE_URL}images/farm/icons/`

const FILES = new Set([
  'apple', 'apple-pie', 'apple-slice',
  'blueberry', 'blueberry-jam', 'blueberry-muffin',
  'bread', 'candy', 'caramel-popcorn',
  'carrot', 'carrot-juice', 'cereal',
  'chili', 'chili-powder', 'corn', 'cornmeal', 'cucumber',
  'dried-tofu', 'egg', 'eggplant', 'eggplant-casserole', 'eggplant-slice',
  'essential-oil', 'flour', 'french-fries',
  'grape', 'grape-juice', 'hot-sauce', 'ketchup', 'lavender',
  'mango', 'mango-juice', 'mango-smoothie', 'milk', 'oil',
  'onion', 'onion-soup', 'onion-soup-mix',
  'peanut', 'peanut-butter', 'peanut-cookie', 'perfume', 'petal',
  'pickled-cucumber', 'pickle-salad',
  'potato', 'potato-chips', 'pumpkin', 'pumpkin-pie', 'pumpkin-puree',
  'soybean', 'strawberry', 'strawberry-cake', 'strawberry-jam',
  'sugar', 'sugarcane', 'syrup', 'tofu', 'tomato', 'tomato-pasta',
  'watermelon', 'watermelon-juice', 'watermelon-smoothie',
  'wheat', 'wine',
])

const NAME_MAP = {
  苹果: 'apple',
  苹果派: 'apple-pie',
  苹果馅饼: 'apple-pie',
  苹果片: 'apple-slice',
  蓝莓: 'blueberry',
  蓝莓酱: 'blueberry-jam',
  蓝莓马芬: 'blueberry-muffin',
  蓝莓松饼: 'blueberry-muffin',
  面包: 'bread',
  糖果: 'candy',
  焦糖爆米花: 'caramel-popcorn',
  爆米花: 'caramel-popcorn',
  胡萝卜: 'carrot',
  胡萝卜汁: 'carrot-juice',
  麦片: 'cereal',
  谷物: 'cereal',
  辣椒: 'chili',
  辣椒粉: 'chili-powder',
  玉米: 'corn',
  玉米粉: 'cornmeal',
  黄瓜: 'cucumber',
  豆腐干: 'dried-tofu',
  鸡蛋: 'egg',
  蛋: 'egg',
  茄子: 'eggplant',
  茄子煲: 'eggplant-casserole',
  茄子片: 'eggplant-slice',
  精油: 'essential-oil',
  面粉: 'flour',
  薯条: 'french-fries',
  葡萄: 'grape',
  葡萄汁: 'grape-juice',
  辣酱: 'hot-sauce',
  辣椒酱: 'hot-sauce',
  番茄酱: 'ketchup',
  番茄沙司: 'ketchup',
  薰衣草: 'lavender',
  芒果: 'mango',
  芒果汁: 'mango-juice',
  芒果昔: 'mango-smoothie',
  芒果奶昔: 'mango-smoothie',
  牛奶: 'milk',
  油: 'oil',
  食用油: 'oil',
  洋葱: 'onion',
  洋葱汤: 'onion-soup',
  洋葱汤料: 'onion-soup-mix',
  花生: 'peanut',
  花生酱: 'peanut-butter',
  花生饼: 'peanut-cookie',
  花生曲奇: 'peanut-cookie',
  香水: 'perfume',
  花瓣: 'petal',
  腌黄瓜: 'pickled-cucumber',
  泡菜: 'pickled-cucumber',
  泡菜沙拉: 'pickle-salad',
  土豆: 'potato',
  马铃薯: 'potato',
  薯片: 'potato-chips',
  南瓜: 'pumpkin',
  南瓜派: 'pumpkin-pie',
  南瓜泥: 'pumpkin-puree',
  大豆: 'soybean',
  黄豆: 'soybean',
  草莓: 'strawberry',
  草莓蛋糕: 'strawberry-cake',
  草莓酱: 'strawberry-jam',
  糖: 'sugar',
  蔗糖: 'sugar',
  甘蔗: 'sugarcane',
  糖浆: 'syrup',
  豆腐: 'tofu',
  番茄: 'tomato',
  西红柿: 'tomato',
  番茄意面: 'tomato-pasta',
  西瓜: 'watermelon',
  西瓜汁: 'watermelon-juice',
  西瓜昔: 'watermelon-smoothie',
  西瓜奶昔: 'watermelon-smoothie',
  小麦: 'wheat',
  麦子: 'wheat',
  葡萄酒: 'wine',
  红酒: 'wine',
}

const toSlug = (value) => {
  if (!value) return ''
  return String(value)
    .trim()
    .replace(/^icon[-_]?/i, '')
    .replace(/\.svg$/i, '')
    .replace(/_/g, '-')
    .toLowerCase()
}

export const farmIconSrc = (handbook) => {
  if (!handbook) return ''
  if (typeof handbook === 'string') {
    handbook = { icon: handbook, name: handbook }
  }

  const candidates = [
    handbook.icon,
    handbook.en_name,
    handbook.name_en,
    handbook.slug,
    handbook.en_icon,
    NAME_MAP[handbook.name],
  ]

  for (const raw of candidates) {
    const slug = toSlug(raw)
    if (FILES.has(slug)) {
      return `${ICON_BASE}${slug}.svg`
    }
  }

  return ''
}
