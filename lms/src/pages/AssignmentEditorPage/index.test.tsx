import {beforeEach, describe, expect, it, vi} from 'vitest';
import '@testing-library/jest-dom';
import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {MemoryRouter} from 'react-router-dom';

const api = vi.hoisted(() => ({
  createAssignment: vi.fn(),
  patchAssignment: vi.fn(),
  uploadAttachments: vi.fn(),
  publishAssignment: vi.fn(),
}));
const courseApi = vi.hoisted(() => ({listGroupSets: vi.fn()}));

vi.mock('@/apis/services/assignment-api', () => ({assignmentApiService: api}));
vi.mock('@/apis/services/course-api', () => ({courseApiService: courseApi}));

import {AssignmentEditorForm} from './index';

const draft = {
  id: 88,
  courseId: 31,
  title: 'Recovery assignment',
  description: '',
  pointsPossible: 100,
  dueAtLocal: '2026-08-30T10:00:00',
  submissionType: 'Individual',
  allowedFileTypes: ['pdf'],
  maxFileCount: 3,
  maxFileSizeBytes: 10 * 1024 * 1024,
  state: 'Draft',
  attachments: [],
};

const response = <T,>(data: T) => ({
  status: 200,
  code: 'SUCCESS',
  message: 'OK',
  timestamp: '2026-08-17T00:00:00Z',
  data,
});

const renderEditor = () => {
  const client = new QueryClient({defaultOptions: {queries: {retry: false}}});
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <AssignmentEditorForm courseId={31}/>
      </MemoryRouter>
    </QueryClientProvider>
  );
};

const fillRequiredFields = async () => {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText('Assignment name'), 'Recovery assignment');
  fireEvent.change(screen.getByLabelText('Due time'), {target: {value: '2026-08-30T10:00'}});
  return user;
};

describe('AssignmentEditorForm recovery workflow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.createAssignment.mockResolvedValue(response(draft));
    api.patchAssignment.mockResolvedValue(response(draft));
    api.publishAssignment.mockResolvedValue(response({...draft, state: 'Published'}));
    courseApi.listGroupSets.mockResolvedValue(response([
      {
        id: 9,
        courseId: 31,
        name: 'Project teams',
        defaultCapacity: 4,
        joinOpensAtLocal: null,
        joinClosesAtLocal: null,
        timezone: 'America/Los_Angeles',
        locked: false,
        openForSelfService: true,
        myGroup: null,
        groups: [{id: 91}, {id: 92}],
      },
    ]));
  });

  it('retries attachment failure against the already-created draft', async () => {
    renderEditor();
    const user = await fillRequiredFields();
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(fileInput, new File(['brief'], 'brief.pdf', {type: 'application/pdf'}));
    api.uploadAttachments
      .mockRejectedValueOnce(new Error('storage unavailable'))
      .mockResolvedValueOnce(response([{id: 501, originalName: 'brief.pdf', sizeBytes: 5}]));

    await user.click(screen.getByRole('button', {name: 'Publish'}));

    expect(await screen.findByText('Draft #88 is already saved.')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Retry will continue this same assignment');
    expect(api.createAssignment).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', {name: 'Publish'}));

    await waitFor(() => expect(api.publishAssignment).toHaveBeenCalledTimes(1));
    expect(api.createAssignment).toHaveBeenCalledTimes(1);
    expect(api.patchAssignment).toHaveBeenCalledTimes(1);
    expect(api.patchAssignment).toHaveBeenCalledWith(31, 88, expect.objectContaining({
      title: 'Recovery assignment',
    }));
  });

  it('does not upload successful attachments again when publish is retried', async () => {
    renderEditor();
    const user = await fillRequiredFields();
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(fileInput, new File(['brief'], 'brief.pdf', {type: 'application/pdf'}));
    api.uploadAttachments.mockResolvedValue(response([{id: 501, originalName: 'brief.pdf', sizeBytes: 5}]));
    api.publishAssignment
      .mockRejectedValueOnce(new Error('publish unavailable'))
      .mockResolvedValueOnce(response({...draft, state: 'Published'}));

    await user.click(screen.getByRole('button', {name: 'Publish'}));

    expect(await screen.findByText('Draft #88 is already saved.')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('publishing failed');

    await user.click(screen.getByRole('button', {name: 'Publish'}));

    await waitFor(() => expect(api.publishAssignment).toHaveBeenCalledTimes(2));
    expect(api.uploadAttachments).toHaveBeenCalledTimes(1);
    expect(api.createAssignment).toHaveBeenCalledTimes(1);
    expect(api.patchAssignment).toHaveBeenCalledTimes(1);
  });

  it('uses a named group-set selector for group assignments', async () => {
    renderEditor();
    const user = await fillRequiredFields();

    await user.selectOptions(screen.getByLabelText('Submission type'), 'Group');
    await screen.findByRole('option', {name: 'Project teams (2 groups)'});
    await user.selectOptions(screen.getByLabelText('Group set'), '9');
    await user.click(screen.getByRole('button', {name: 'Publish'}));

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    await waitFor(() => expect(api.createAssignment).toHaveBeenCalledWith(31, expect.objectContaining({
      submissionType: 'Group',
      groupSetId: 9,
    })));
  });
});
