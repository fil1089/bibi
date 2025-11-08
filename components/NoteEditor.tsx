
import React, { useState, useEffect, useRef } from 'react';

interface NoteEditorProps {
    note: string;
    onSave: (note: string) => void;
    onClose: () => void;
}

const NoteEditor: React.FC<NoteEditorProps> = ({ note, onSave, onClose }) => {
    const [text, setText] = useState(note);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.focus();
            textareaRef.current.select();
        }
    }, []);

    const handleSave = () => {
        onSave(text);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            handleSave();
        }
        if (e.key === 'Escape') {
            onClose();
        }
    };

    return (
        <div 
            className="fixed inset-0 z-40 bg-black bg-opacity-70 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div 
                className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-4 flex flex-col gap-3 border border-gray-700"
                onClick={e => e.stopPropagation()}
                onKeyDown={handleKeyDown}
            >
                <h2 className="text-lg font-semibold text-gray-100">Редактировать заметку</h2>
                <textarea
                    ref={textareaRef}
                    value={text}
                    onChange={e => setText(e.target.value)}
                    className="w-full h-32 p-2 bg-gray-900 border border-gray-600 rounded-md focus:ring-yellow-400 focus:border-yellow-400 placeholder-gray-400 text-white"
                    placeholder="Введите вашу заметку..."
                />
                <div className="flex justify-end gap-2">
                    <button 
                        onClick={onClose}
                        className="px-4 py-2 text-sm bg-gray-600 text-gray-200 rounded-md hover:bg-gray-500 transition-colors"
                    >
                        Отмена
                    </button>
                    <button 
                        onClick={handleSave}
                        className="px-4 py-2 text-sm bg-yellow-400 hover:bg-yellow-500 text-black font-semibold rounded-md transition-colors"
                    >
                        Сохранить
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NoteEditor;
