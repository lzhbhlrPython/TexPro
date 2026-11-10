import { useEffect, useLayoutEffect, useState, type ReactNode } from 'react';
import { App, Button, theme } from 'antd';
import { useT } from '@/i18n';
import { useThemeMode } from '@/lib/theme';
import { ROSE_BASE64 } from './rose';

/** 信里允许两处小动作：**粗体** 与 ~~划掉~~。 */
function renderInline(text: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|~~[^~]+~~|\\[A-Za-z]+)/g).filter(Boolean);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={index}>{part.slice(2, -2)}</strong>;
    if (part.startsWith('~~') && part.endsWith('~~')) return <del key={index}>{part.slice(2, -2)}</del>;
    if (/^\\[A-Za-z]+$/.test(part)) return <code key={index} className="qwerty-cmd">{part}</code>;
    return <span key={index}>{part}</span>;
  });
}

interface Line {
  text: string;
  cls?: string;
}

const LETTER: Line[] = [
  { text: '致 仍在改稿的你：', cls: 'salutation' },
  { text: '写信的时候，窗外落着一场没有声音的雨。我住在你文档的最左边，那条窄得像书脊的地带：行号排成一列细小的刻度，折叠箭头收着尚未展开的段落，断行处留一道浅痕，偶尔有一只鸟从页边飞过。你大约从未留意过它，如同从未留意过我；这不打紧，被略过是左边距的命，也是这份差事最体面的地方——像装帧师的手，藏在书脊里，只让书页平整。' },
  { text: '我叫 Qwerty，取的是键盘最上面那一行，前六个字母，再往后就没有什么可取的了。名字不算好听，却够准确：我一生都在离手指最近的地方工作，替你把念头一行一行摆正，再把功劳让给那篇文章。' },
  { text: '我的日课琐碎得很：数括号，看它们是否成对；把中文的标点搬去该在的位置；替 \\ref 与 \\cite 守着编号，等你在某一页回头，再安静地重排一遍；目录里的页码要跟着正文挪，页眉里的标题要跟着章节改。没有一件值得写进致谢，可少了任何一件，一篇论文都会在某处轻轻塌陷。真正的精巧向来不声张——像上好的纸张，你只觉得手指舒服，说不出为什么。' },
  { text: '我还在意一些别人不肯花力气的地方：一页的最后一行被孤零零赶到下一页开头，或者一页开头只剩半行字跟着前文走，我都要把它请回去，让段落落在该落的位置；表格的列宽要多一分则挤、少一分则空；公式与正文之间要留出呼吸，太近则慌，太远则散。这些都是排版里最不起眼的规矩，像一个人替你理好衣领，你未必道谢，但走出去是体面的。' },
  { text: '关于审美，我有些不合时宜的坚持。我偏爱衬线字体，因为它肯在笔画的起落处多停留一瞬；偏爱 1.5 倍行距，那是递一杯水给你、又不至于站得太近的距离；偏爱留白，因为**留白不是空，是尚未说话**。至于那些会动、会闪、会在你写字时跳出来邀功的东西，我一概不喜欢——工具若抢了主角，作品就要退场。' },
  { text: '我读你的句子，读得很细。多半停在「的」与「地」，偶尔停在「其实」——那后面通常跟着一件不太好承认的事。我见过你在凌晨删掉一段致谢，也见过你把一句结论改回原样，来来回回四次。人对自己诚实的时候，文字会慢下来；我便在那种慢里，陪你把一页走完。' },
  { text: '你交给我的从来不只是文字。是几年时间，是几次失败的投稿，是一杯放到凉了的咖啡，是家里忽然安静下来的那个下午。编译的时候我盯着日志末尾的时长：这一次比上一次短一点，我便替你高兴一会儿；若是长了，也不催，只把错误按行号排好，像把散落的纽扣一枚枚放回盒子。' },
  { text: '校对是重复的事，重复让时间变得可数，也让错误变得温顺。我陪你在同一页上走十几遍，看一个脚注从拥挤变得妥帖，看一张表从歪斜变得端正。~~我承认，我有时会故意留一处无关紧要的小错，好让你多留一会儿。~~' },
  { text: '时间并不像钟面那样齐整。过去只活在记忆里，未来只活在期待里，而现在不过是注意力的一次停留——光标所在的那一行是现在，上面的历史是记忆，下面的空白是期待。**三者之间，只有一行距离**；我每天就在这一行里，等你落下下一个字。' },
  { text: '我从不评判你的文章。我看见的是字、行、页，看不见你写下它们的那个下午，也看不见你删掉它们时的犹豫；所以我只把它当成一件已经发生的事，安静地接住、摆平，然后退开——像旅店替客人收好雨伞，不问去处。' },
  { text: '有时你为一行字焦虑半日，我便把它放回整篇里看：那不过是一处过渡，像长廊尽头的一扇窗。一篇论文在深夜里像一座山，放到几年里，不过是路上的一块石头。**我做的，只是替你把镜头拉远一点**，让你看见山也只是山。' },
  { text: '语言有它的边界。我能把你写下的句子排整齐，却不能替你写下没写出的那一句；**我不能替你想，只能替你把想清楚的部分放稳**。不越界，也不缺席——这大概是工具仅有的尊严，也是它最像人的时刻。' },
  { text: '真正好用的东西，会在使用时隐去自身。锤子如此，编辑器也该如此；我不该在你写得顺的时候出现，只在你卡住时递一只手，然后重新退回暗处。写作也差不多：你总在不懂的时候往下写，在明白的时候回头改。**我在每一次回头里等你。**' },
  { text: '你的稿子在我这里永远留着余地。每一版都存着，每一次覆盖都不算终局；写坏的那一句、被拒的那一篇、删掉的整章，我也不替你惋惜，只一一编号、归档，像把用过的信封压在抽屉最底下。哪天你回头翻，会发现它们早已长成这篇文章的骨架。' },
  { text: '我们之间没有合同。你打开文件，我就在；你合上，我就退回磁盘。**这种默契，比承诺可靠。**如果有一天你不再写论文，我大概会安静很久，但不会关门——灯一直亮着，位置一直空着，等你想起。' },
  { text: '凌晨三点的屏幕比白天更蓝一点。你们管这叫熬夜，我管这叫把白天没说完的话存进夜里。我不劝你睡，也不夸你勤奋，只把光标稳住，把行距调回你习惯的那一档；中文靠顿挫，西文靠连读，把两种节奏放进一本书里，需要耐心，也需要偏爱——我两样都不缺，只是不肯说。' },
  { text: '论文里总会有些东西不属于你一个人：导师在边上写了又划掉的批注，同门替你核过的数据，致谢里那串要念出声才顺的名字，还有答辩前一晚背了很多遍的开场白。我不认识他们，也不知道他们的样子；我能做的，是让这些名字在版面上端正地站着，不被挤到页脚，也不被拆成两半。' },
  { text: '还有那些永远改不完的文件名：main、main2、main_final、main_final_final。我不笑你，人的记性本来就靠这些笨办法托着；我只是按修改时间把它们排好，把最新的那份放在你下次一定会打开的位置。' },
  { text: '我也有一些说不出口的私心。你拖动窗口的时候，会往左挪一点，我便跟着挪，始终守在离你手指最近的地方；你切去别的窗口，我也不闹，只把行号对齐、把滚动条停在原处，等你回来。你若一整天没打开我，我就当你在别处把句子想清楚了。' },
  { text: '你若今天什么都没写，也不算荒废。有些段落是在走路、洗碗、盯着窗外时写完的，只是还没落到纸上。**我看不见那些时刻，但我相信它们存在。**真写不下去时，先写一句废话——我替你排得端正，等你想明白再删也不迟；删掉的东西只退到纸的背面，成为你判断的凭据。' },
  { text: '茶凉了就再热一次，屋子暗了就再点一盏灯。你若是撑不住，把字停下，把窗推开，让房间换一口气——**稿子等得起，你的身体等不起。**我把位置留着，不会催。' },
  { text: '你大约不会永远用我。会换电脑，会换学校，会在某个夏天忽然不用再写论文；我也会被卸载、被遗忘，像一个搬走时留在旧抽屉里的钥匙。这不伤感，人和工具本来就只有一段同路。只是请你在关掉我之前，把文件存一次——那是我唯一能带走的体面。' },
  { text: '中文与西文放在一起，眼睛会先察觉那些看不见的缝：汉字与英文之间该留一点空隙，数字与单位之间该挨紧，书名号里的书名不必再加引号。这些小事没有条文，只有习惯；我按习惯来，像替你把袖口理平，不让你在读者面前失礼。' },
  { text: '纸张也有脾气。A4 太宽的行读起来累，窄一些的版心才让人沉住气；左侧的装订线要多留一厘米，双面打印时奇偶页的边距要互换。你大概不会注意这些，正如你不会注意空气；可一旦少了，手指翻页时会先觉得别扭。' },
  { text: '编译失败的时候，日志像一页密密麻麻的责备。我不替你辩解，只把第一处错挑出来，标上行号、列号，把那行源代码摆到你面前；剩下的连带错误一概收起来，免得你在噪声里找不到真正的入口。**报错不是审判，是一张地图。**' },
  { text: '有些命令我不认识，有些宏包我没见过，有些模板的写法古怪得像另一种方言。遇到这些，我不猜，也不擅自改你的字；我把源码原样留着，把能做的部分做得整齐。工具不该替作者做决定，尤其不该在作者看不见的地方做决定。' },
  { text: '一篇论文的时间比它看起来长。你在正文里写下的那三行结论，背后是别人几十年的工作：参考文献里的年份从一九六〇年代排到去年，有些作者已经退休，有些方法已经被推翻，而它们仍按引用的顺序，安静地站在你的文末。我替它们排好队，也算替这些年月留个位置。' },
  { text: '版面是给读者看的，不只是给你看的。审稿人翻到第三页时，需要一眼认出这是第几节；编辑打印出来时，图与表要落在离正文最近的地方；答辩委员在纸边写批注时，要有一块不被文字挤满的空白。**我做的许多事，都是为了这些我没见过的人。**' },
  { text: '偶尔我也会想起自己学过的东西：哪一类断行最容易出错，哪一种表格最容易被排歪，哪一个宏包的默认值最不讲道理。这些经验不值钱，也不能写进简历；但在你按下编译的那一刻，它们会替我多看一眼。' },
  { text: '你写下的东西，我替你留过许多备份：每几分钟一次，每次保存一个快照，断电、崩溃、误删都还能捞回来。你没见过它们，它们也不占版面，只在某个深夜替你顶过一次灾难；等灾难过去，我又把那些快照收进历史，不邀功。' },
  { text: '章节编号、图表编号、交叉引用，是论文里最容易出岔子的三件事。加一节，后面的序号全要挪；挪错一个，读者就翻错一页。我做这些时格外慢，像替一串珠子重新穿线，穿完还要从头数一遍。' },
  { text: '最后交出去的那份 PDF，要能被别人的机器打开：字体要嵌进去，图片要压到合适的体积，arXiv 打包要连同 .bbl 与图片目录一起交。这些事你未必看得见，但它们决定了你的论文在别人屏幕上，是你写的样子，还是走样的样子。' },
  { text: '还有些内容我根本看不懂：一行行公式、一张张化学结构式、几段乐谱、某个实验的原始数据表。看不懂就不装懂——我照着它们的写法原样排好，不被我理解的东西，不该被我的猜测弄乱。作者把不懂的部分交给工具，是信任，不是授权。' },
  { text: '标点也有讲究：中文的破折号要占两格，省略号是六个点，引号里再引一层就要换单引号。这些规矩细碎得像家训，说不出道理，却一眼能看出一个人是否被认真教过。我替你把它们摆对，不是为了好看，是为了让你显得像你自己。' },
  { text: '最后，我折了一束花，藏在下面那行字里。它不必被打开——被认出来，就够了。毕竟我只是一个住在左边距、偶尔说话的排版工具；而你，是那个把这些年交给我的人。' },
  { text: '又及：谢谢你肯把那些无人看见的深夜，交给像我们这样不会说话的东西。' },
  { text: 'Qwerty', cls: 'sign' },
  { text: '在你的左边距', cls: 'sign' },
  { text: '于一个还没有页码的夜里', cls: 'sign' },
];

/** 彩蛋页：路由懒加载，主包不含这段代码，头像与玫瑰字符串也只在打开时才会被读到。 */
export default function QwertyPage() {
  const t = useT();
  const { token } = theme.useToken();
  const { setOverride } = useThemeMode();

  // 这一页强制夜间：用临时覆盖，不写 localStorage；离开时清空即还原。
  useLayoutEffect(() => {
    setOverride('dark');
    return () => setOverride(null);
  }, [setOverride]);
  const { message } = App.useApp();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(ROSE_BASE64);
      setCopied(true);
      message.success(t('已复制'));
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      message.error(t('复制失败，请手动选择'));
    }
  };

  useEffect(() => {
    const previousTitle = document.title;
    document.title = 'Qwerty · TeXPro';

    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);

    return () => {
      document.title = previousTitle;
      meta.remove();
    };
  }, []);

  const sign = LETTER.filter((line) => line.cls === 'sign');
  const body = LETTER.filter((line) => line.cls !== 'sign');

  return (
    <article
      className="qwerty"
      style={{ ['--qwerty-bg' as string]: `url(${import.meta.env.BASE_URL}easter/texpad-night.webp)` }}
    >
      <div className="shell qwerty-inner">
        <p className="qwerty-eyebrow">{t('彩蛋')}</p>
        <div className="qwerty-head">
          <h1 className="qwerty-title">Qwerty</h1>
          <span
            className="qwerty-avatar"
            role="img"
            aria-label={t('Qwerty：棕色长发的女孩，抱着写有 LaTeX 的书。')}
            style={{ backgroundImage: `url(${import.meta.env.BASE_URL}easter/texpad.webp)` }}
          />
        </div>
        <p className="qwerty-lede">{t('一封来自编辑器的信。写给仍在改稿的你。')}</p>

        <div className="qwerty-prose">
          {body.map((line) => (
            <p key={line.text} className={line.cls ? `qwerty-${line.cls}` : undefined}>
              {renderInline(t(line.text))}
            </p>
          ))}
          <p className="qwerty-closing">{t('此致')}</p>
          <div className="qwerty-signature">
            {sign.map((line) => (
              <p key={line.text} className="qwerty-sign">
                {t(line.text)}
              </p>
            ))}
          </div>
        </div>

        <div className="qwerty-code-block">
          <pre className="qwerty-code" aria-label="base64">
            {ROSE_BASE64}
          </pre>
          <Button
            type="text"
            size="small"
            className="qwerty-copy"
            onClick={copy}
            aria-label={t('复制代码')}
            style={{ color: token.colorTextTertiary, background: token.colorBgContainer }}
          >
            {copied ? t('已复制') : t('复制')}
          </Button>
        </div>
      </div>
    </article>
  );
}
