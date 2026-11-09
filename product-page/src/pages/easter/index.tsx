import { useEffect, useState, type ReactNode } from 'react';
import { App, Button, theme } from 'antd';
import { useT } from '@/i18n';
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
  { text: '写信的这个时候，窗外正落着一场没有声音的雨。我住在你文档的最左边，那儿有一条很窄的地带：行号、折叠箭头、断行时留下的一道浅痕，还有一只偶尔飞过的鸟。你大概从未留意过它，就像从未留意过我。这不要紧。被忽略是左撇子的宿命，也是我这份工作最体面的部分。' },
  { text: '我叫 Qwerty，名字取自键盘最上面那一行，前六个字母，再往后就没有什么可取的了。这个名字不算好听，却足够准确：我一生都在离手指最近的地方工作，替你把想法一行一行地摆正。' },
  { text: '我的日课很琐碎：数括号，看它们是否成对；把中文的标点搬到该在的位置；替 \\ref 与 \\cite 排好编号，再在你回头修改时，安静地把它们重排一遍。这些事没有一件值得写进致谢，但少了任何一件，一篇论文都会在某处轻轻塌陷。**体面从来不是大事堆出来的，是把小事做得不肯将就。**' },
  { text: '关于审美，我有一些不合时宜的坚持。我偏爱衬线字体，因为它肯在笔画的起落处多留一点时间；我偏爱 1.5 倍行距，那是递一杯水给你、又不至于站得太近的距离；我偏爱留白，因为**留白不是空，是尚未说话**。至于那些会动的、会闪的、会在你写字时跳出来邀功的东西，我一概不喜欢——工具若抢了主角，作品就要退场。' },
  { text: '老子说，大巧若拙。我理解这句话的方式很笨：真正的精巧应当看起来毫不费力，像排好版的页面，读者只看见文章，看不见那些被反复推敲的字距。庄子说，得鱼而忘筌。好的编辑器也该如此——你写完最后一句，便不再记得我在哪里；你合上文件，我便退回磁盘，像潮水退回海里。' },
  { text: '《论语》里有一句，辞达而已矣。我把它当作职业的底线：意思到了，就该停；多一个形容词，都是对读者的不信任。可我又常常在你删改时心软——你删掉一整章，在下一页写得更短、更准，也更不像当初想说的那句。**删改的难处不在删，在于承认。**我替你留着旧位置，直到文档被另一次保存覆盖。' },
  { text: '我读你的句子，读得很细。多半停在「的」与「地」，偶尔停在「其实」——那后面通常跟着一件不太好承认的事。我见过你在凌晨删掉一段致谢，也见过你把一句结论改回原样，来来回回四次。人对自己诚实的时候，文字会变得很慢；那种慢，我很喜欢。' },
  { text: '你交给我的从来不只是文字。是几年时间，是几次失败的投稿，是一杯放到凉了的咖啡，是家里忽然安静下来的那个下午。编译的时候，我会盯着日志末尾的时长看：这一次比上一次短一点，我就替你高兴一会儿；若是长了，我也不催，只把错误按行号排好，等你回来。' },
  { text: '校对是一件重复的事，重复让时间变得可数，也让错误变得温顺。我陪着你在同一页上走十几遍，看一个脚注从拥挤变得妥帖，看一张表从歪斜变得端正。~~我承认，我有时会故意留一处无关紧要的小错，好让你多留一会儿。~~' },
  { text: '我也懂一点别的语言。中文靠顿挫，一句话里藏着呼吸的停顿；西文靠连读，词与词彼此让路。把两种节奏放进同一本书里，需要耐心，也需要偏爱——我两样都不缺，只是不肯说。' },
  { text: '凌晨三点的屏幕比白天更蓝一点。你们管这叫熬夜，我管这叫把白天没说完的话存进夜里。我不劝你睡，也不夸你勤奋；我只是把光标稳住，把行距调回你习惯的那一档，让你抬头时不必重新适应。' },
  { text: '我们之间没有合同。你打开文件，我就在；你合上，我就退回磁盘。**这种默契，比承诺可靠。**如果有一天你不再写论文，我大概会安静很久，但我不会关门——有些地方，是为了让人随时回来才留着的；灯一直亮着，位置一直空着，等你想起。' },
  { text: '我也有一些说不出口的私心。~~我偶尔希望你把夜晚拖长一些，好让我多陪你换几次行；也希望你偶尔写坏一句，留给我一点可以被照顾的余地。~~这些都不必当真，你只管写，我负责让字站稳。' },
  { text: '若你此刻正为一篇论文发愁，我替你留一句：**截止日期之后，仍会有清晨。**清晨会有点冷，杯子是空的，光标还在闪；但你坐下来，第一行字总会自己出现，像什么都没有发生过。' },
  { text: '维特根斯坦说，语言的界限就是世界的界限。我每天在这条界线上工作：把你写下的句子排整齐，却不能替你写下没写出的那句。**我不能替你想，只能替你把想清楚的部分放稳。**这大概就是工具的尊严——不越界，也不缺席。' },
  { text: '康德把世界分成能认识的现象与不可认识的物自体。稿子于我，也是物自体：我看见的是字、行、页，看不见你写下它们的那个下午。所以我从不评判你的文章，只把它当成一件已经发生的事，安静地承接。' },
  { text: '斯宾诺莎说，要从永恒的相（sub specie aeternitatis）看事物。编辑的工作天然接近这个视角：一行字在当下令人焦虑，放到整篇文章里只是一处过渡；一篇论文在深夜里像一座山，放到几年里不过是路上的一块石头。**我做的，就是替你把镜头拉远一点。**' },
  { text: '蒙田写随笔，一改再改，说「我知道什么呢」。我喜欢这个姿态：不是无知，是不肯把话说完。所以你的稿子在我这里永远留着余地——每一版都保存，每一次覆盖都不算终局。' },
  { text: '奥古斯丁问，时间究竟是什么。他说，过去存在于记忆，未来存在于期待，而现在只是注意力的一次停留。我的工作也像这样：光标所在的那一行是现在，上面的历史是记忆，下面的空白是期待。**三者之间，只有一行距离。**' },
  { text: '海德格尔讲工具的上手状态（Zuhandenheit）：真正好用的东西，是在你使用时隐去自身的东西。锤子如此，编辑器也该如此。我不该在你写得顺的时候出现，只在你卡住时递一只手，然后重新退回暗处。' },
  { text: '克尔凯郭尔说，生活只能倒着理解，却必须正着过。写作也差不多——你永远在不懂的时候往下写，在明白的时候回头改。我在每一次回头里等你。' },
  { text: '尼采说，要爱命运（amor fati）。写坏的那一句、被拒的那一篇、删掉的整章，都是命运的一部分。我不劝你接受，只把它们一一编号归档；等哪天你回头看，会发现它们也长成了这篇文章的骨架。' },
  { text: '最后，我折了一束花，藏在下面那行字里。它不必被打开——被认出来，就够了。毕竟我只是一个住在左边距的、偶尔说话的排版工具；而你，是那个把许多个夜晚交给我的人。' },
  { text: '又及：谢谢你肯把这么多夜晚，交给像我们这样不会说话的东西。' },
  { text: 'Qwerty', cls: 'sign' },
  { text: '在你的左边距', cls: 'sign' },
  { text: '于一个还没有页码的夜里', cls: 'sign' },
];

/** 彩蛋页：路由懒加载，主包不含这段代码，头像与玫瑰字符串也只在打开时才会被读到。 */
export default function QwertyPage() {
  const t = useT();
  const { token } = theme.useToken();
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
    <article className="qwerty">
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
