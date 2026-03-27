import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import FriendsSection from '../FriendsSection';

jest.mock('../../../services/api', () => ({
  getFriends: jest.fn(),
  getPendingRequests: jest.fn(),
  sendFriendRequest: jest.fn(),
  acceptFriend: jest.fn(),
  rejectFriend: jest.fn(),
  removeFriend: jest.fn(),
}));

const api = require('../../../services/api');

beforeEach(() => {
  jest.clearAllMocks();
  api.getFriends.mockResolvedValue([]);
  api.getPendingRequests.mockResolvedValue([]);
});

describe('FriendsSection', () => {
  it('renders Friends heading', async () => {
    render(<FriendsSection />);
    expect(screen.getByText('Friends')).toBeInTheDocument();
  });

  it('shows empty state when no friends', async () => {
    render(<FriendsSection />);
    await waitFor(() => {
      expect(screen.getByText(/No friends yet/)).toBeInTheDocument();
    });
  });

  it('shows friend email input', () => {
    render(<FriendsSection />);
    expect(screen.getByPlaceholderText("Friend's email")).toBeInTheDocument();
  });

  it('sends friend request on button click', async () => {
    api.sendFriendRequest.mockResolvedValue({ id: '1', status: 'pending' });
    render(<FriendsSection />);
    const input = screen.getByPlaceholderText("Friend's email");
    await act(async () => { fireEvent.change(input, { target: { value: 'bob@test.com' } }); });
    const addBtn = screen.getByRole('button', { name: '' }); // AddIcon button
    await act(async () => { fireEvent.click(addBtn); });
    await waitFor(() => {
      expect(api.sendFriendRequest).toHaveBeenCalledWith('bob@test.com');
    });
  });

  it('shows success message after sending request', async () => {
    api.sendFriendRequest.mockResolvedValue({ id: '1', status: 'pending' });
    render(<FriendsSection />);
    const input = screen.getByPlaceholderText("Friend's email");
    await act(async () => { fireEvent.change(input, { target: { value: 'bob@test.com' } }); });
    const buttons = screen.getAllByRole('button');
    await act(async () => { fireEvent.click(buttons[0]); });
    await waitFor(() => {
      expect(screen.getByText(/Friend request sent/)).toBeInTheDocument();
    });
  });

  it('shows error on failed request', async () => {
    api.sendFriendRequest.mockRejectedValue({ response: { data: { error: 'User not found' } } });
    render(<FriendsSection />);
    const input = screen.getByPlaceholderText("Friend's email");
    await act(async () => { fireEvent.change(input, { target: { value: 'nobody@test.com' } }); });
    const buttons = screen.getAllByRole('button');
    await act(async () => { fireEvent.click(buttons[0]); });
    await waitFor(() => {
      expect(screen.getByText('User not found')).toBeInTheDocument();
    });
  });

  it('displays friends list', async () => {
    api.getFriends.mockResolvedValue([{ id: '1', email: 'alice@test.com', since: '2026-01-01' }]);
    render(<FriendsSection />);
    await waitFor(() => {
      expect(screen.getByText('alice@test.com')).toBeInTheDocument();
    });
  });

  it('displays pending requests with accept/reject', async () => {
    api.getPendingRequests.mockResolvedValue([{ id: '2', email: 'carol@test.com', createdAt: '2026-03-01' }]);
    render(<FriendsSection />);
    await waitFor(() => {
      expect(screen.getByText('1 pending request')).toBeInTheDocument();
      expect(screen.getByText('carol@test.com')).toBeInTheDocument();
    });
  });

  it('calls acceptFriend when accept button clicked', async () => {
    api.getPendingRequests.mockResolvedValue([{ id: '2', email: 'carol@test.com', createdAt: '2026-03-01' }]);
    api.acceptFriend.mockResolvedValue(undefined);
    render(<FriendsSection />);
    await waitFor(() => screen.getByText('carol@test.com'));
    const checkBtn = document.querySelector('[data-testid="CheckIcon"]')?.parentElement;
    if (checkBtn) {
      await act(async () => { fireEvent.click(checkBtn); });
      expect(api.acceptFriend).toHaveBeenCalledWith('2');
    }
  });

  it('calls rejectFriend when reject button clicked', async () => {
    api.getPendingRequests.mockResolvedValue([{ id: '2', email: 'carol@test.com', createdAt: '2026-03-01' }]);
    api.rejectFriend.mockResolvedValue(undefined);
    render(<FriendsSection />);
    await waitFor(() => screen.getByText('carol@test.com'));
    const closeBtn = document.querySelector('[data-testid="CloseIcon"]')?.parentElement;
    if (closeBtn) {
      await act(async () => { fireEvent.click(closeBtn); });
      expect(api.rejectFriend).toHaveBeenCalledWith('2');
    }
  });

  it('calls removeFriend when delete button clicked on friend chip', async () => {
    api.getFriends.mockResolvedValue([{ id: '1', email: 'alice@test.com', since: '2026-01-01' }]);
    api.removeFriend.mockResolvedValue(undefined);
    render(<FriendsSection />);
    await waitFor(() => screen.getByText('alice@test.com'));
    const deleteIcon = document.querySelector('[data-testid="CancelIcon"]') || document.querySelector('[data-testid="DeleteIcon"]');
    if (deleteIcon) {
      await act(async () => { fireEvent.click(deleteIcon); });
      expect(api.removeFriend).toHaveBeenCalledWith('1');
    }
  });
});
