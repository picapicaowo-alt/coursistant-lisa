import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import {parseUtcTimestamp} from "@/utils/datetime";

dayjs.extend(relativeTime);

export const formatAnnouncementRelativeTime = (postedAt: string): string =>
  dayjs(parseUtcTimestamp(postedAt)).fromNow();
