
import React from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
// Fix: Correctly import KeyboardButtonConfig type.
import type { KeyboardButtonConfig } from './NumericKeyboard';
// Fix: Import newly created DragHandleIcon.
import { DragHandleIcon } from './Icons';

interface KeyboardSettingsModalProps {
    layout: KeyboardButtonConfig[];
    onChange: (layout: KeyboardButtonConfig[]) => void;
    onClose: () => void;
}

const KeyboardSettingsModal: React.FC<KeyboardSettingsModalProps> = ({ layout, onChange, onClose }) => {
    
    function handleDragEnd(result: DropResult) {
        if (!result.destination) return;
        const updated = Array.from(layout);
        const [removed] = updated.splice(result.source.index, 1);
        updated.splice(result.destination.index, 0, removed);
        onChange(updated);
    }

    return (
        <div 
            className="fixed inset-0 z-50 bg-black bg-opacity-70 flex items-center justify-center p-4"
            onClick={onClose}
            aria-modal="true"
            role="dialog"
        >
            <div 
                className="bg-gray-800 rounded-lg shadow-xl w-full max-w-sm p-4 flex flex-col gap-3 border border-gray-700"
                onClick={e => e.stopPropagation()}
            >
                <h2 className="text-lg font-semibold text-gray-100">Настройка клавиатуры</h2>
                <p className="text-sm text-gray-400">Перетащите кнопки, чтобы изменить их порядок. Изменения сохраняются автоматически.</p>

                <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="keyboard-layout">
                        {(provided) => (
                            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2 max-h-80 overflow-y-auto pr-2">
                                {layout.map((btn, index) => (
                                    <Draggable key={btn.id} draggableId={btn.id} index={index}>
                                        {(provided, snapshot) => (
                                            <div ref={provided.innerRef}
                                                 {...provided.draggableProps}
                                                 {...provided.dragHandleProps}
                                                 className={`p-2 rounded-lg flex items-center gap-3 transition-colors ${snapshot.isDragging ? 'bg-yellow-500/20' : 'bg-gray-900'}`}
                                            >
                                                <DragHandleIcon className="w-5 h-5 text-gray-500 flex-shrink-0" />
                                                <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-gray-800 rounded-md">
                                                    {btn.renderPreview()}
                                                </div>
                                                <span className="text-gray-200">{btn.label}</span>
                                            </div>
                                        )}
                                    </Draggable>
                                ))}
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>
                </DragDropContext>

                <div className="flex justify-end gap-2 mt-4">
                    <button 
                        onClick={onClose}
                        className="px-4 py-2 text-sm bg-yellow-400 hover:bg-yellow-500 text-black font-semibold rounded-md transition-colors"
                    >
                        Готово
                    </button>
                </div>
            </div>
        </div>
    );
};

export default KeyboardSettingsModal;
