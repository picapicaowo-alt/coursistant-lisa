import React from "react";
import {Link} from "react-router-dom";
import {useQuery} from "@tanstack/react-query";
import "./PostComponent.scss";
import {dashboardApiService} from "@/apis/services/dashboard-api";
import {RecentAnnouncement} from "@/apis";
import {useRequiredAuth} from "@/contexts/RequiredAuthContext";
import {formatAnnouncementRelativeTime} from "./announcementTime";

/**
 * Recent Announcements.
 *
 * This region exists in the API but has no widget in Figma, which is the
 * mirror image of the AI chat and average-score widgets that are drawn but
 * unbacked. It was previously handed `posts={[]}` as a literal, so it rendered
 * an empty list forever.
 *
 * The payload is headers only — no body and no author — so the card shows what
 * is actually there and links into the course for the rest. There is nothing
 * to truncate and no excerpt to fabricate.
 */
const PostComponent: React.FC = () => {
  const {user} = useRequiredAuth();

  const query = useQuery({
    queryKey: ['dashboard', 'announcements', user.id],
    queryFn: async (): Promise<RecentAnnouncement[]> => {
      const response = await dashboardApiService.getRecentAnnouncements();
      if (!response.data) {
        throw new Error('Malformed response from /v2/me/announcements/recent');
      }
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const announcements = query.data ?? [];

  return (
    <div className="posts-container">
      <div className="posts-header">
        <h1 className="font-semibold text-[1.2rem] text-primary-color ml-1">Announcements</h1>
      </div>
      <div className="horizontal-line"/>
      <div className="posts-list">
        {query.isPending && <p className="text-sm opacity-70">Loading announcements…</p>}

        {query.isError && (
          <div className="text-sm">
            <p>Couldn&apos;t load announcements.</p>
            <button
              type="button"
              onClick={() => void query.refetch()}
              className="text-primary-color underline cursor-pointer mt-1"
            >
              Retry
            </button>
          </div>
        )}

        {!query.isPending && !query.isError && announcements.length === 0 && (
          <p className="text-sm opacity-70">No recent announcements.</p>
        )}

        {!query.isError && announcements.map((announcement) => (
          <Link
            className="post-item"
            key={`${announcement.courseId}-${announcement.id}`}
            to={`/course/${announcement.courseId}/announcements/${announcement.id}`}
            aria-label={`Open announcement: ${announcement.title}`}
          >
            <div className="post-item-content">
              <div className="post-item-content-header">
                <h2 className="post-item-title text-primary-color font-semibold">
                  {announcement.title}
                </h2>
                <div className="post-item-metadata">
                  <span className="post-item-course brand-color px-3 py-0.5 rounded-md font-medium text-[0.8rem]">
                    {announcement.courseCode}
                  </span>
                  <span className="post-item-unread-slot">
                    {announcement.unread ? (
                      <span
                        className="post-item-unread w-2 h-2 rounded-full"
                        style={{backgroundColor: "var(--xl-danger)"}}
                        aria-label="Unread"
                      />
                    ) : null}
                  </span>
                  <p className="post-item-time">{formatAnnouncementRelativeTime(announcement.postedAt)}</p>
                </div>
              </div>
              <div className="post-item-content-body">
                <span className="text-brand-primary whitespace-nowrap">Open announcement</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default PostComponent;
