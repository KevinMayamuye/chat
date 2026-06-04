import {
  useEffect,
  useState,
} from "react";

import { searchUsers } from "../services/userService";

const NewChatModal = ({
  isOpen,
  onClose,
  onSelectUser,
  existingChatUserIds,
}) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setResults([]);
      setError("");
      setSearched(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !query.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      setError("");

      try {
        const data = await searchUsers(
          query.trim()
        );

        setResults(data);
        setSearched(true);
      } catch (err) {
        setError(
          err.response?.data?.message ||
          "Search failed"
        );
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, isOpen]);

  if (!isOpen) return null;

  const handleSelect = (foundUser) => {
    onSelectUser(foundUser);
    onClose();
  };

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
    >
      <div
        className="modal"
        onClick={(e) =>
          e.stopPropagation()
        }
      >
        <div className="modal-header">
          <h3>New chat</h3>

          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <input
          type="text"
          className="modal-search"
          placeholder="Search by username..."
          value={query}
          onChange={(e) =>
            setQuery(e.target.value)
          }
          autoFocus
        />

        <div className="modal-results">
          {loading && (
            <p className="modal-message">
              Searching...
            </p>
          )}

          {!loading && error && (
            <p className="modal-message modal-error">
              {error}
            </p>
          )}

          {!loading &&
            !error &&
            searched &&
            results.length === 0 && (
              <p className="modal-message">
                No users found
              </p>
            )}

          {!loading &&
            results.map((foundUser) => {
              const hasChat =
                existingChatUserIds.has(
                  foundUser._id
                );

              return (
                <div
                  key={foundUser._id}
                  className="user-item"
                  onClick={() =>
                    handleSelect(foundUser)
                  }
                >
                  <div className="chat-item-name">
                    {foundUser.username}
                  </div>

                  {hasChat && (
                    <div className="chat-item-preview">
                      Existing conversation
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};

export default NewChatModal;
