export type DocumentationSection = 'use' | 'develop';
export declare function documentationSection(group: string): DocumentationSection;
export declare function documentationHome(section: DocumentationSection): '/docs' | '/developers';
