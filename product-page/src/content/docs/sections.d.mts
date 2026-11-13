export type DocumentationSection = 'use' | 'develop';
export declare function documentationSection(group: string): DocumentationSection;
export declare function documentationHome(section: DocumentationSection): '/docs' | '/developers';
export declare function documentationEntry(section: DocumentationSection): 'start' | 'dev-setup';
