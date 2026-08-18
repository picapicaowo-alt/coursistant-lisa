import {FormEvent, useEffect, useState} from 'react';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {ArrowLeft, CalendarDays, Clock3, MapPin, Pencil, Plus, Trash2, X} from 'lucide-react';
import {Link, useNavigate, useParams} from 'react-router-dom';
import type {CourseEvent, CourseEventPayload} from '@/apis';
import {unwrapData} from '@/apis';
import {courseApiService} from '@/apis/services/course-api';
import {EnglishDateInput, EnglishTimeInput} from '@/components/EnglishDateInput';
import {useCourseAccess} from '@/hooks/useCourseAccess';
import styles from './index.module.scss';

const emptyEvent = (): CourseEventPayload => ({
  name: '', date: '', startTime: '', endTime: '', location: '', description: '',
});

const toDraft = (event: CourseEvent): CourseEventPayload => ({
  name: event.name,
  date: event.date,
  startTime: event.startTime?.slice(0, 5) ?? '',
  endTime: event.endTime?.slice(0, 5) ?? '',
  location: event.location ?? '',
  description: event.description ?? '',
});

const CourseEventsPage = () => {
  const params = useParams();
  const courseId = Number(params.courseId);
  const eventId = params.eventId ? Number(params.eventId) : null;
  const validCourse = Number.isInteger(courseId) && courseId > 0;
  const validEvent = eventId === null || (Number.isInteger(eventId) && eventId > 0);
  const access = useCourseAccess(validCourse ? courseId : null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [draft, setDraft] = useState<CourseEventPayload>(emptyEvent);
  const [editorMode, setEditorMode] = useState<'create' | 'edit' | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const eventsQuery = useQuery({
    queryKey: ['course-events', courseId],
    queryFn: async () => unwrapData(await courseApiService.listCourseEvents(courseId), 'listCourseEvents'),
    enabled: validCourse,
    retry: 1,
  });
  const selectedEventQuery = useQuery({
    queryKey: ['course-event', courseId, eventId],
    queryFn: async () => unwrapData(await courseApiService.getCourseEvent(courseId, eventId!), 'getCourseEvent'),
    enabled: validCourse && validEvent && eventId !== null,
    retry: 1,
  });
  const selectedEvent = selectedEventQuery.data;

  useEffect(() => {
    setEditorMode(null);
    setConfirmDelete(false);
    setMessage(null);
  }, [eventId]);

  const saveEvent = useMutation({
    mutationFn: () => {
      const request: CourseEventPayload = {
        ...draft,
        name: draft.name.trim(),
        startTime: draft.startTime || null,
        endTime: draft.endTime || null,
        location: draft.location?.trim() || null,
        description: draft.description?.trim() || null,
      };
      return editorMode === 'edit' && eventId !== null
        ? courseApiService.updateCourseEvent(courseId, eventId, request)
        : courseApiService.createCourseEvent(courseId, request);
    },
    onSuccess: async response => {
      const saved = unwrapData(response, 'saveCourseEvent');
      setEditorMode(null);
      setMessage(editorMode === 'edit' ? 'Event updated.' : 'Event created.');
      await Promise.all([
        queryClient.invalidateQueries({queryKey: ['course-events', courseId]}),
        queryClient.invalidateQueries({queryKey: ['course-event', courseId, saved.id]}),
      ]);
      if (editorMode === 'create') navigate(`/course/${courseId}/events/${saved.id}`);
    },
    onError: () => setMessage('The event could not be saved.'),
  });

  const deleteEvent = useMutation({
    mutationFn: () => courseApiService.deleteCourseEvent(courseId, eventId!),
    onSuccess: async () => {
      await queryClient.invalidateQueries({queryKey: ['course-events', courseId]});
      navigate(`/course/${courseId}/events`, {replace: true});
    },
    onError: () => setMessage('The event could not be deleted.'),
  });

  const submit = (submitEvent: FormEvent) => {
    submitEvent.preventDefault();
    setMessage(null);
    saveEvent.mutate();
  };
  const openCreate = () => { setDraft(emptyEvent()); setEditorMode('create'); setMessage(null); };
  const openEdit = () => { if (selectedEvent) { setDraft(toDraft(selectedEvent)); setEditorMode('edit'); setMessage(null); } };
  const invalidTime = Boolean(draft.startTime && draft.endTime && draft.endTime <= draft.startTime);
  const sortedEvents = [...(eventsQuery.data ?? [])].sort((a, b) => `${a.date}${a.startTime ?? ''}`.localeCompare(`${b.date}${b.startTime ?? ''}`));
  const failed = !validCourse || !validEvent || eventsQuery.isError || selectedEventQuery.isError;

  return (
    <main className={styles.page}>
      <div className={styles.header}>
        <Link to={eventId === null ? `/course/${courseId}` : `/course/${courseId}/events`} className={styles.backLink} aria-label={eventId === null ? 'Back to course' : 'Back to all events'}><ArrowLeft size={22}/></Link>
        <div className={styles.headerText}><p className={styles.eyebrow}>Course events</p><h1>{selectedEvent?.name || (eventId === null ? 'Events' : 'Loading event…')}</h1></div>
        {access.canManageCourseEvents && editorMode === null ? <button type="button" className={styles.primaryButton} onClick={eventId === null ? openCreate : openEdit}>{eventId === null ? <><Plus size={17}/> Add event</> : <><Pencil size={17}/> Edit event</>}</button> : null}
      </div>

      {message ? <p className={message.includes('could not') ? styles.error : styles.success} role="status">{message}</p> : null}
      {failed ? <section className={styles.card} role="alert"><h2>This event view could not be loaded</h2><button type="button" className={styles.primaryButton} onClick={() => { void eventsQuery.refetch(); void selectedEventQuery.refetch(); }}>Try again</button></section> : null}

      {editorMode ? (
        <form className={styles.card} onSubmit={submit}>
          <div className={styles.cardHeader}><div><h2>{editorMode === 'create' ? 'Create event' : 'Edit event'}</h2><p>Times use the course timezone.</p></div><button type="button" className={styles.iconButton} aria-label="Close event editor" onClick={() => setEditorMode(null)}><X size={18}/></button></div>
          <div className={styles.formGrid}>
            <label className={styles.full}><span>Name</span><input required value={draft.name} onChange={e => setDraft(current => ({...current, name: e.target.value}))}/></label>
            <label><span>Date</span><EnglishDateInput required value={draft.date} onChangeValue={value => setDraft(current => ({...current, date: value}))}/></label>
            <span/>
            <label><span>Starts</span><EnglishTimeInput value={draft.startTime ?? ''} onChangeValue={value => setDraft(current => ({...current, startTime: value}))}/></label>
            <label><span>Ends</span><EnglishTimeInput value={draft.endTime ?? ''} onChangeValue={value => setDraft(current => ({...current, endTime: value}))}/></label>
            <label className={styles.full}><span>Location</span><input value={draft.location ?? ''} onChange={e => setDraft(current => ({...current, location: e.target.value}))}/></label>
            <label className={styles.full}><span>Description</span><textarea rows={5} value={draft.description ?? ''} onChange={e => setDraft(current => ({...current, description: e.target.value}))}/></label>
          </div>
          {invalidTime ? <p className={styles.error} role="alert">End time must be later than start time.</p> : null}
          <div className={styles.formFooter}><button type="submit" className={styles.primaryButton} disabled={saveEvent.isPending || !draft.name.trim() || !draft.date || invalidTime}>{saveEvent.isPending ? 'Saving…' : 'Save event'}</button></div>
        </form>
      ) : eventId !== null && selectedEvent ? (
        <section className={styles.card}>
          {selectedEvent.description ? <p className={styles.description}>{selectedEvent.description}</p> : <p className={styles.muted}>No description was provided.</p>}
          <dl className={styles.metadata}>
            <div><dt><CalendarDays size={18}/><span className={styles.srOnly}>Date</span></dt><dd>{selectedEvent.date}</dd></div>
            {selectedEvent.startTime ? <div><dt><Clock3 size={18}/><span className={styles.srOnly}>Time</span></dt><dd>{selectedEvent.startTime.slice(0, 5)}{selectedEvent.endTime ? ` – ${selectedEvent.endTime.slice(0, 5)}` : ''} {selectedEvent.timezone}</dd></div> : null}
            {selectedEvent.location ? <div><dt><MapPin size={18}/><span className={styles.srOnly}>Location</span></dt><dd>{selectedEvent.location}</dd></div> : null}
          </dl>
          {access.canManageCourseEvents ? <div className={styles.dangerZone}>{confirmDelete ? <><p>Delete this event for everyone in the course?</p><button type="button" className={styles.dangerButton} onClick={() => deleteEvent.mutate()} disabled={deleteEvent.isPending}>Confirm delete</button><button type="button" className={styles.secondaryButton} onClick={() => setConfirmDelete(false)}>Cancel</button></> : <button type="button" className={styles.dangerButton} onClick={() => setConfirmDelete(true)}><Trash2 size={16}/> Delete event</button>}</div> : null}
        </section>
      ) : eventId === null && !failed ? (
        <section className={styles.card}>
          <div className={styles.cardHeader}><div><h2>All events</h2><p>{sortedEvents.length} scheduled</p></div></div>
          {eventsQuery.isPending ? <p className={styles.muted}>Loading events…</p> : sortedEvents.length === 0 ? <p className={styles.muted}>No course events have been scheduled.</p> : <ul className={styles.eventList}>{sortedEvents.map(item => <li key={item.id}><Link to={`/course/${courseId}/events/${item.id}`}><span className={styles.dateTile}><strong>{new Date(`${item.date}T12:00:00`).toLocaleDateString('en-US', {day: 'numeric'})}</strong><small>{new Date(`${item.date}T12:00:00`).toLocaleDateString('en-US', {month: 'short'})}</small></span><span className={styles.eventText}><strong>{item.name}</strong><small>{item.startTime ? item.startTime.slice(0, 5) : 'All day'}{item.location ? ` · ${item.location}` : ''}</small></span><span aria-hidden="true">→</span></Link></li>)}</ul>}
        </section>
      ) : null}
    </main>
  );
};

export default CourseEventsPage;
