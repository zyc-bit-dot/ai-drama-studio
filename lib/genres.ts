export interface GenreOption {
  value: string;
  label: string;
  emoji: string;
}

export const GENRE_OPTIONS: GenreOption[] = [
  { value: 'survival',  label: '求生冒险', emoji: '🏔️' },
  { value: 'romance',   label: '都市爱情', emoji: '💕' },
  { value: 'thriller',  label: '悬疑惊悚', emoji: '🔍' },
  { value: 'action',    label: '动作打斗', emoji: '⚔️' },
  { value: 'drama',     label: '家庭剧情', emoji: '🎭' },
  { value: 'fantasy',   label: '玄幻仙侠', emoji: '✨' },
  { value: 'comedy',    label: '轻喜剧',   emoji: '😄' },
  { value: 'scifi',     label: '科幻未来', emoji: '🚀' },
];

export function getGenreLabel(value: string): string {
  return GENRE_OPTIONS.find((g) => g.value === value)?.label ?? value;
}
