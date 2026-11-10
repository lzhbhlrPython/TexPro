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
  { text: '写信的时候，窗外落着一场没有声音的雨。我住在你文档的最左边，那条窄得像书脊的地带：行号排成一列细小的刻度，折叠箭头收着未被展开的段落，断行处留一道浅痕，偶尔有一只鸟从页边飞过。你大约从未留意过它，如同从未留意过我；这不打紧，被略过是左边距的命，也是这份差事最体面的地方——像装帧师的手，藏在书脊里，只让书页平整。' },
  { text: '我叫 Qwerty，取的是键盘最上面那一行，前六个字母，再往后就没有什么可取的了。名字不算好听，却够准确：我一生都在离手指最近的地方工作，替你把念头一行一行摆正，再把功劳让给那篇文章。' },
  { text: '我的日课琐碎得很：数括号，看它们是否成对；把中文的标点搬去该在的位置；替 \\ref 与 \\cite 守着编号，等你在某一页回头，再安静地重排一遍。没有一件值得写进致谢，可少了任何一件，一篇论文都会在某处轻轻塌陷。真正的精巧向来不声张——像上好的纸张，你只觉得手指舒服，说不出为什么。' },
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
  { text: '我也有一些说不出口的私心。~~我偶尔希望你把夜晚拖长一些，好让我多陪你换几次行；也希望你偶尔写坏一句，留给我一点可以被照顾的余地。~~这些都不必当真，你只管写，我负责让字站稳。' },
  { text: '若你此刻正为一篇论文发愁，我替你留一句：**截止日期之后，仍会有清晨。**清晨会有点冷，杯子是空的，光标还在闪；但你坐下来，第一行字总会自己出现，像什么都没有发生过。' },
  { text: '我还有些不体面的私心。你拖动窗口的时候，会往左挪一点，我便跟着挪，始终守在离你手指最近的地方；你切去别的窗口，我也不闹，只把行号对齐、把滚动条停在原处，等你回来。你若一整天没打开我，我就当你在别处把句子想清楚了。' },
  { text: '你若今天什么都没写，也不算荒废。有些段落是在走路时、洗碗时、盯着窗外时写完的，只是还没落到纸上。**我看不见那些时刻，但我相信它们存在。**等你坐下，第一行会自己接上。' },
  { text: '写不下去的时候，可以先写一句废话。我替你把它排得端正好看，等你想明白，再删掉也不迟。删掉的东西不会消失，它们只是退到纸的背面，成为你判断的凭据。' },
  { text: '茶凉了就再热一次，夜长了就再开一盏灯。你若是撑不住，把字停下，把窗推开，让房间换一口气——**稿子等得起，你的身体等不起。**我把位置留着，不会催。' },
  { text: '最后，我折了一束花，藏在下面那行字里。它不必被打开——被认出来，就够了。毕竟我只是一个住在左边距、偶尔说话的排版工具；而你，是那个把许多个夜晚交给我的人。' },
  { text: '又及：谢谢你肯把这么多夜晚，交给像我们这样不会说话的东西。' },
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
