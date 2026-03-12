import { Article, HskLevel } from '../types';

const MOCK_ARTICLES: Article[] = [
  {
    title: '我的一天',
    title_pinyin: 'Wǒ de yī tiān',
    title_english: 'My Day',
    hsk_level: 2,
    topic: 'Daily life',
    sentences: [
      {
        chinese: '我每天早上七点起床。',
        pinyin: 'Wǒ měi tiān zǎo shang qī diǎn qǐ chuáng.',
        english: 'I get up at seven o\'clock every morning.',
      },
      {
        chinese: '我先洗脸，然后吃早饭。',
        pinyin: 'Wǒ xiān xǐ liǎn, rán hòu chī zǎo fàn.',
        english: 'First I wash my face, then I eat breakfast.',
      },
      {
        chinese: '早饭我喜欢吃鸡蛋和面包。',
        pinyin: 'Zǎo fàn wǒ xǐ huān chī jī dàn hé miàn bāo.',
        english: 'For breakfast I like to eat eggs and bread.',
      },
      {
        chinese: '八点半我去公司上班。',
        pinyin: 'Bā diǎn bàn wǒ qù gōng sī shàng bān.',
        english: 'At eight-thirty I go to the office for work.',
      },
      {
        chinese: '我坐地铁去公司，大概要三十分钟。',
        pinyin: 'Wǒ zuò dì tiě qù gōng sī, dà gài yào sān shí fēn zhōng.',
        english: 'I take the subway to the office, which takes about thirty minutes.',
      },
      {
        chinese: '中午我和同事一起吃午饭。',
        pinyin: 'Zhōng wǔ wǒ hé tóng shì yī qǐ chī wǔ fàn.',
        english: 'At noon I eat lunch together with my colleagues.',
      },
      {
        chinese: '我们公司附近有很多餐厅。',
        pinyin: 'Wǒ men gōng sī fù jìn yǒu hěn duō cān tīng.',
        english: 'Near our office there are many restaurants.',
      },
      {
        chinese: '下午我在办公室工作，有时候开会。',
        pinyin: 'Xià wǔ wǒ zài bàn gōng shì gōng zuò, yǒu shí hòu kāi huì.',
        english: 'In the afternoon I work in the office, and sometimes have meetings.',
      },
      {
        chinese: '晚上六点我下班回家。',
        pinyin: 'Wǎn shàng liù diǎn wǒ xià bān huí jiā.',
        english: 'At six in the evening I finish work and go home.',
      },
      {
        chinese: '回家以后，我做饭、看书，然后睡觉。',
        pinyin: 'Huí jiā yǐ hòu, wǒ zuò fàn, kàn shū, rán hòu shuì jiào.',
        english: 'After getting home, I cook, read, and then sleep.',
      },
    ],
    vocabulary: [
      {
        word: '起床',
        pinyin: 'qǐ chuáng',
        definition: 'to get out of bed; to get up',
        hsk_level: 2,
      },
      {
        word: '附近',
        pinyin: 'fù jìn',
        definition: 'nearby; in the vicinity of',
        hsk_level: 3,
      },
      {
        word: '同事',
        pinyin: 'tóng shì',
        definition: 'colleague; coworker',
        hsk_level: 3,
      },
      {
        word: '开会',
        pinyin: 'kāi huì',
        definition: 'to hold or attend a meeting',
        hsk_level: 3,
      },
      {
        word: '以后',
        pinyin: 'yǐ hòu',
        definition: 'after; afterwards; later',
        hsk_level: 2,
      },
    ],
  },
  {
    title: '周末去市场',
    title_pinyin: 'Zhōu mò qù shì chǎng',
    title_english: 'Going to the Market on the Weekend',
    hsk_level: 3,
    topic: 'Food & cooking',
    sentences: [
      {
        chinese: '今天是星期六，我决定去菜市场买东西。',
        pinyin: 'Jīn tiān shì xīng qī liù, wǒ jué dìng qù cài shì chǎng mǎi dōng xi.',
        english: 'Today is Saturday, and I decided to go to the food market to buy things.',
      },
      {
        chinese: '市场里人很多，非常热闹。',
        pinyin: 'Shì chǎng lǐ rén hěn duō, fēi cháng rè nào.',
        english: 'The market was very crowded and lively.',
      },
      {
        chinese: '我先去买蔬菜，挑了一些西红柿和黄瓜。',
        pinyin: 'Wǒ xiān qù mǎi shū cài, tiāo le yī xiē xī hóng shì hé huáng guā.',
        english: 'I first went to buy vegetables, and picked out some tomatoes and cucumbers.',
      },
      {
        chinese: '卖菜的大叔告诉我今天的西红柿特别新鲜。',
        pinyin: 'Mài cài de dà shū gào sù wǒ jīn tiān de xī hóng shì tè bié xīn xiān.',
        english: 'The vegetable seller told me that today\'s tomatoes were especially fresh.',
      },
      {
        chinese: '然后我去买了一条鱼和半斤猪肉。',
        pinyin: 'Rán hòu wǒ qù mǎi le yī tiáo yú hé bàn jīn zhū ròu.',
        english: 'Then I went and bought a fish and half a jin of pork.',
      },
      {
        chinese: '水果区有很多种类，我买了苹果和香蕉。',
        pinyin: 'Shuǐ guǒ qū yǒu hěn duō zhǒng lèi, wǒ mǎi le píng guǒ hé xiāng jiāo.',
        english: 'The fruit section had many varieties; I bought apples and bananas.',
      },
      {
        chinese: '最后，我在一家小店买了豆腐和酱油。',
        pinyin: 'Zuì hòu, wǒ zài yī jiā xiǎo diàn mǎi le dòu fu hé jiàng yóu.',
        english: 'Finally, I bought tofu and soy sauce at a small shop.',
      },
      {
        chinese: '回到家以后，我开始准备晚饭。',
        pinyin: 'Huí dào jiā yǐ hòu, wǒ kāi shǐ zhǔn bèi wǎn fàn.',
        english: 'After getting home, I started preparing dinner.',
      },
      {
        chinese: '我做了番茄炒蛋和清蒸鱼，味道很好。',
        pinyin: 'Wǒ zuò le fān qié chǎo dàn hé qīng zhēng yú, wèi dào hěn hǎo.',
        english: 'I made tomato and egg stir-fry and steamed fish — it tasted great.',
      },
    ],
    vocabulary: [
      {
        word: '热闹',
        pinyin: 'rè nào',
        definition: 'lively; bustling; full of noise and activity',
        hsk_level: 4,
      },
      {
        word: '新鲜',
        pinyin: 'xīn xiān',
        definition: 'fresh (food); novel; new',
        hsk_level: 3,
      },
      {
        word: '种类',
        pinyin: 'zhǒng lèi',
        definition: 'kind; type; variety; category',
        hsk_level: 4,
      },
      {
        word: '清蒸',
        pinyin: 'qīng zhēng',
        definition: 'to steam (cooking method); steamed',
        hsk_level: 5,
      },
      {
        word: '准备',
        pinyin: 'zhǔn bèi',
        definition: 'to prepare; to get ready',
        hsk_level: 3,
      },
    ],
  },
];

export function getMockArticle(hskLevel: HskLevel, topic: string): Article {
  // Find the closest matching article by HSK level
  const sorted = [...MOCK_ARTICLES].sort(
    (a, b) => Math.abs(a.hsk_level - hskLevel) - Math.abs(b.hsk_level - hskLevel)
  );
  const article = sorted[0];
  // Return it with the requested level/topic stamped on it
  return { ...article, hsk_level: hskLevel, topic: topic.trim() || article.topic };
}
