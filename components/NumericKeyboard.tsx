import React, { useState, useRef, useEffect } from 'react';
import { TrashIcon, HighlightIcon, ChevronDownIcon, DocumentTextIcon, BackspaceIcon, PlusIcon, SaveIcon, ChevronLeftIcon, ChevronRightIcon, FilterIcon } from './Icons';
import { FilterType } from '../types';

// Fix: Export KeyboardButtonConfig type for use in KeyboardSettingsModal.
export type KeyboardButtonConfig = {
    id: string;
    label: string;
    renderPreview: () => React.ReactNode;
};

interface NumericKeyboardProps {
    onKeyPress: (key: string) => void;
    onBackspace: () => void;
    onDone: () => void;
    onClear: () => void;
    highlightMode: boolean;
    onHighlightToggle: () => void;
    onAddNote: () => void;
    isCellSelected: boolean;
    onReset: () => void;
    onSave: () => void;
    searchQuery: string;
    searchMatchCount: number;
    currentMatchIndex: number;
    onNavigateMatch: (direction: 'next' | 'prev') => void;
    filter: FilterType;
    setFilter: (filter: FilterType) => void;
}

const KeyButton: React.FC<{ 
    onClick: () => void; 
    children: React.ReactNode; 
    className?: string; 
    title?: string; 
    disabled?: boolean; 
}> = ({ onClick, children, className = '', title, disabled = false }) => (
    <button
        onClick={onClick}
        className={`flex items-center justify-center h-12 w-full text-xl font-semibold text-white bg-gray-800 rounded-md hover:bg-gray-700 active:bg-yellow-400 active:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        title={title}
        disabled={disabled}
        aria-label={title || (typeof children === 'string' ? children : 'keyboard button')}
    >
        {children}
    </button>
);

const NumericKeyboard: React.FC<NumericKeyboardProps> = (props) => {
    const { 
        onKeyPress, 
        onBackspace, 
        onDone, 
        onClear, 
        highlightMode, 
        onHighlightToggle, 
        onAddNote, 
        isCellSelected,
        onReset,
        onSave,
        searchQuery,
        searchMatchCount,
        currentMatchIndex,
        onNavigateMatch,
        filter,
        setFilter,
    } = props;

    const [isFilterOpen, setFilterOpen] = useState(false);
    const filterRef = useRef<HTMLDivElement>(null);

    const filterOptions: { value: FilterType, label: string }[] = [
        { value: 'all', label: 'Все строки' },
        { value: 'green', label: 'Зеленые' },
        { value: 'red', label: 'Красные' },
        { value: 'none', label: 'Без цвета' },
    ];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
                setFilterOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const buttons = [
        // Row 1
        { id: '1', content: '1', action: () => onKeyPress('1') },
        { id: '2', content: '2', action: () => onKeyPress('2') },
        { id: '3', content: '3', action: () => onKeyPress('3') },
        { id: 'clear', content: <TrashIcon className="w-6 h-6" />, action: onClear, className: "!bg-red-700 hover:!bg-red-600", title: "Очистить поиск" },
        // Row 2
        { id: '4', content: '4', action: () => onKeyPress('4') },
        { id: '5', content: '5', action: () => onKeyPress('5') },
        { id: '6', content: '6', action: () => onKeyPress('6') },
        { id: 'backspace', content: <BackspaceIcon className="w-6 h-6" />, action: onBackspace, title: "Удалить" },
        // Row 3
        { id: '7', content: '7', action: () => onKeyPress('7') },
        { id: '8', content: '8', action: () => onKeyPress('8') },
        { id: '9', content: '9', action: () => onKeyPress('9') },
        { id: 'highlight', content: <HighlightIcon className="w-6 h-6" />, action: onHighlightToggle, className: highlightMode ? '!bg-yellow-400 !text-black' : '!bg-gray-700 hover:!bg-gray-600', title: "Режим выделения" },
        // Row 4
        { id: 'actions', content: null, action: () => {} },
        { id: 'done', content: <ChevronDownIcon className="w-6 h-6 text-black" />, action: onDone, className: "bg-yellow-400 text-black hover:bg-yellow-500", title: "Скрыть клавиатуру" },
        { id: '0', content: '0', action: () => onKeyPress('0') },
        { id: 'add_note', content: <DocumentTextIcon className="w-6 h-6" />, action: onAddNote, disabled: !isCellSelected, className: "!bg-gray-700 hover:!bg-gray-600", title: "Добавить/изменить заметку" },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-sm p-2">
            <div className="max-w-md mx-auto">
                <div className="flex items-center gap-2 mb-2">
                    <div className="flex-grow pl-3 pr-8 py-2 text-sm bg-gray-800 border border-gray-600 rounded-md text-white h-10 flex items-center">
                        <span className="truncate">
                            {searchQuery || <span className="text-gray-400">Поиск...</span>}
                        </span>
                    </div>

                    {searchMatchCount > 0 && (
                        <div className="flex items-center gap-1 bg-gray-800 border border-gray-600 rounded-md px-2 py-1 flex-shrink-0 h-10">
                            <span className="text-xs text-gray-300">{currentMatchIndex + 1} из {searchMatchCount}</span>
                            <button onClick={() => onNavigateMatch('prev')} className="p-1 rounded-full hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed" disabled={currentMatchIndex <= 0}>
                                <ChevronLeftIcon className="w-4 h-4 text-gray-200" />
                            </button>
                            <button onClick={() => onNavigateMatch('next')} className="p-1 rounded-full hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed" disabled={currentMatchIndex >= searchMatchCount - 1}>
                                <ChevronRightIcon className="w-4 h-4 text-gray-200" />
                            </button>
                        </div>
                    )}
                    <div className="relative flex-shrink-0" ref={filterRef}>
                        <button 
                            onClick={() => setFilterOpen(prev => !prev)}
                            className={`p-2 bg-gray-800 rounded-md hover:bg-gray-700 transition-colors border border-gray-600 h-10 ${filter !== 'all' ? 'text-yellow-400 border-yellow-400' : 'text-gray-200'}`}
                            title="Фильтр"
                        >
                            <FilterIcon className="w-5 h-5" />
                        </button>
                        {isFilterOpen && (
                            <div className="absolute right-0 bottom-full mb-2 w-40 bg-gray-800 border border-gray-600 rounded-md shadow-lg z-10 overflow-hidden">
                                {filterOptions.map(option => (
                                    <button
                                        key={option.value}
                                        onClick={() => {
                                            setFilter(option.value);
                                            setFilterOpen(false);
                                        }}
                                        className={`w-full text-left px-3 py-2 text-sm ${filter === option.value ? 'bg-yellow-500 text-black' : 'text-gray-200 hover:bg-gray-700'}`}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                                <div className="border-t border-gray-600"></div>
                                <button
                                    onClick={() => {
                                        setFilter('all');
                                        setFilterOpen(false);
                                    }}
                                    className="w-full text-left px-3 py-2 text-sm text-gray-200 hover:bg-gray-700"
                                >
                                    Сбросить фильтр
                                </button>
                            </div>
                        )}
                    </div>
                </div>
                <div className="grid grid-cols-4 gap-2">
                    {buttons.map(btn => {
                        if (btn.id === 'actions') {
                            return (
                                <div key="actions" className="flex items-center justify-center gap-2">
                                    <KeyButton onClick={onReset} className="!w-auto flex-1" title="Новый файл">
                                        <PlusIcon className="w-6 h-6" />
                                    </KeyButton>
                                    <KeyButton onClick={onSave} className="!w-auto flex-1 bg-yellow-400 text-black hover:bg-yellow-500" title="Сохранить">
                                        <SaveIcon className="w-6 h-6 text-black" />
                                    </KeyButton>
                                </div>
                            );
                        }
                        return (
                            <KeyButton
                                key={btn.id}
                                onClick={btn.action}
                                className={btn.className}
                                title={btn.title}
                                disabled={btn.disabled}
                            >
                                {btn.content}
                            </KeyButton>
                        )
                    })}
                </div>
            </div>
        </div>
    );
};

export default NumericKeyboard;