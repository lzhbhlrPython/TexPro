/** Canonical Chinese group keys are shared by localized content and static generators. */
export function documentationSection(group) {
  return group === '开发' || group === 'AI 协作' ? 'develop' : 'use';
}
export function documentationHome(section) {
  return section === 'develop' ? '/developers' : '/docs';
}
