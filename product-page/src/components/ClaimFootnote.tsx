import { theme } from 'antd';
import { CLAIM_BY_ID } from '@/data/claims';
import { useT } from '@/i18n';

/** 挂在说法后面的上标脚注，点开就是对应的源码文件。 */
export function ClaimRef({ id }: { id: string }) {
  const claim = CLAIM_BY_ID.get(id);
  const t = useT();
  if (!claim) return null;
  return (
    <sup className="claim-ref">
      <a
        href={claim.href}
        target="_blank"
        rel="noreferrer"
        title={`${claim.file} — ${t(claim.note)}`}
        aria-label={`${t('来源')} ${claim.file}`}
      >
        {claim.number}
      </a>
    </sup>
  );
}

/** 章节末尾的注释表；编号与正文里的上标一致。 */
export function ClaimNotes({ ids }: { ids: string[] }) {
  const { token } = theme.useToken();
  const t = useT();

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
            <span> — {t(claim.note)}</span>
          </li>
        );
      })}
    </ol>
  );
}
