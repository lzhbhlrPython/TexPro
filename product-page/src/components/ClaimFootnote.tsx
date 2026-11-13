import { theme } from 'antd';
import { CLAIM_BY_ID } from '@/data/claims';
import { useMessages } from '@/i18n';

/** 挂在说法后面的上标脚注，点开就是对应的源码文件。 */
export function ClaimRef({ id }: { id: string }) {
  const claim = CLAIM_BY_ID.get(id);
  const msg = useMessages();
  if (!claim) return null;
  return (
    <sup className="claim-ref">
      <a
        href={claim.href}
        target="_blank"
        rel="noreferrer"
        title={`${claim.file} — ${msg.text(claim.note)}`}
        aria-label={`${msg("site.source.variant3")} ${claim.file}`}
      >
        {claim.number}
      </a>
    </sup>
  );
}

/** 章节末尾的注释表；编号与正文里的上标一致。 */
export function ClaimNotes({ ids }: { ids: string[] }) {
  const { token } = theme.useToken();
  const msg = useMessages();

  return (
    <ol className="claim-notes" style={{ color: token.colorTextTertiary }}>
      {ids.map((id) => {
        const claim = CLAIM_BY_ID.get(id);
        if (!claim) return null;
        return (
          <li key={id}>
            <span className="claim-no">{claim.number}</span>
            <a href={claim.href} target="_blank" rel="noreferrer" style={{ color: token.colorTextSecondary }}>
              {claim.file}
            </a>
            <span> — {msg.text(claim.note)}</span>
          </li>
        );
      })}
    </ol>
  );
}
