import React, { useState, useEffect } from 'react';
import './AIPreviewModal.css';

const AIPreviewModal = ({ isOpen, onClose, originalText, aiSuggestion, onAccept, isLoading }) => {
    const [editedText, setEditedText] = useState(aiSuggestion);

    useEffect(() => {
        setEditedText(aiSuggestion);
    }, [aiSuggestion]);

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h3>AI Suggestion</h3>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>

                <div className="modal-body">
                    {isLoading ? (
                        <div className="loading-spinner">Simulating Design Intelligence...</div>
                    ) : (
                        <>
                            <div className="text-comparison">
                                <div className="original-block">
                                    <h4>Original</h4>
                                    <p>{originalText}</p>
                                </div>
                                <div className="suggestion-block">
                                    <h4>AI Improved (Editable)</h4>
                                    <textarea
                                        value={editedText}
                                        onChange={(e) => setEditedText(e.target.value)}
                                        rows={6}
                                    />
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {!isLoading && (
                    <div className="modal-actions">
                        <button className="btn-reject" onClick={onClose}>Reject</button>
                        <button className="btn-accept" onClick={() => onAccept(editedText)}>Accept Changes</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AIPreviewModal;
