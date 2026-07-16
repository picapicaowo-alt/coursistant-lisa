import dayjs from 'dayjs';

export default function transformDate(date) {
    const time = dayjs(date);
    const today = dayjs();
    const daysAgo = today.diff(time, 'day');
    if (daysAgo === 0) return 'Today';
    if (daysAgo === 1) return 'Yesterday';
    if (daysAgo < 7 && daysAgo > 1) return 'Previous 7 Days';
    return null;
}