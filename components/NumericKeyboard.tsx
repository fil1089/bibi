import React from 'react';
import { TrashIcon, HighlightIcon, ChevronDownIcon, DocumentTextIcon } from './Icons';

interface NumericKeyboardProps {
    onKeyPress: (key: string) => void;
    onBackspace: () => void;
    onDone: () => void;
    onClear: () => void;
    highlightMode: boolean;
    onHighlightToggle: () => void;
    onAddNote: () => void;
    isCellSelected: boolean;
}

const KeyButton: React.FC<{ onClick: () => void; children: React.ReactNode; className?: string; title?: string; disabled?: boolean; }> = ({ onClick, children, className = '', title, disabled = false }) => (
    <button
        onClick={onClick}
        className={`flex items-center justify-center h-12 text-xl font-semibold text-white bg-gray-800 rounded-md hover:bg-gray-700 active:bg-yellow-400 active:text-black transition-colors ${className}`}
        title={title}
        disabled={disabled}
    >
        {children}
    </button>
);

const NumericKeyboard: React.FC<NumericKeyboardProps> = ({ onKeyPress, onBackspace, onDone, onClear, highlightMode, onHighlightToggle, onAddNote, isCellSelected }) => {
    const keys = [
        '1', '2', '3',
        '4', '5', '6',
        '7', '8', '9',
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-sm p-2">
            <div className="grid grid-cols-3 gap-2 max-w-sm mx-auto">
                {keys.map(key => (
                    <KeyButton key={key} onClick={() => onKeyPress(key)}>
                        {key}
                    </KeyButton>
                ))}
                <KeyButton onClick={onBackspace} title="Удалить">⌫</KeyButton>
                <KeyButton onClick={() => onKeyPress('0')}>0</KeyButton>
                <KeyButton onClick={onClear} className="!bg-gray-700 hover:!bg-gray-600" title="Очистить поиск">
                    <TrashIcon className="w-6 h-6"/>
                </KeyButton>

                <div className="col-span-3 flex gap-2">
                    <KeyButton 
                        onClick={onAddNote}
                        className="flex-1 !bg-gray-700 hover:!bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Добавить/изменить заметку (для выделенной ячейки)"
                        disabled={!isCellSelected}
                    >
                        <DocumentTextIcon className="w-6 h-6" />
                    </KeyButton>
                    <KeyButton 
                        onClick={onHighlightToggle} 
                        className={`flex-1 ${highlightMode ? '!bg-yellow-400 !text-black' : '!bg-gray-700 hover:!bg-gray-600'}`} 
                        title={highlightMode ? "Выключить режим выделения" : "Включить режим выделения"}
                    >
                        <HighlightIcon className="w-6 h-6" />
                    </KeyButton>
                    <KeyButton onClick={onDone} className="flex-1 bg-yellow-400 text-black hover:bg-yellow-500" title="Скрыть клавиатуру">
                       <ChevronDownIcon className="w-6 h-6 text-black" />
                    </KeyButton>
                </div>
            </div>
        </div>
    );
};

export default NumericKeyboard;