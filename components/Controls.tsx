
import React, { useState, useRef, useEffect } from 'react';
import { SearchIcon, FilterIcon } from './Icons';
import { FilterType } from '../types';

interface ControlsProps {
    filter: FilterType;
    setFilter: (filter: FilterType) => void;
    onToggleKeyboard: () => void;
}

const Controls: React.FC<ControlsProps> = ({ 
    filter, 
    setFilter,
    onToggleKeyboard
}) => {
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
    
    return (
        <div className="sticky top-0 z-40 bg-black/80 backdrop-blur-sm p-2 sm:p-3 border-b border-gray-700">
            <div className="flex items-center justify-end gap-2 w-full">
                <button 
                    onClick={onToggleKeyboard}
                    className="p-2 bg-gray-800 rounded-md hover:bg-gray-700 transition-colors border border-gray-600 text-gray-200"
                    title="Поиск"
                >
                    <SearchIcon className="w-5 h-5" />
                </button>
                
                <div className="relative flex-shrink-0" ref={filterRef}>
                    <button 
                        onClick={() => setFilterOpen(prev => !prev)}
                        className={`p-2 bg-gray-800 rounded-md hover:bg-gray-700 transition-colors border border-gray-600 ${filter !== 'all' ? 'text-yellow-400 border-yellow-400' : 'text-gray-200'}`}
                        title="Фильтр"
                    >
                        <FilterIcon className="w-5 h-5" />
                    </button>
                    {isFilterOpen && (
                        <div className="absolute right-0 mt-2 w-40 bg-gray-800 border border-gray-600 rounded-md shadow-lg z-10 overflow-hidden">
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
        </div>
    );
};

export default Controls;