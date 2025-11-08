
import React, { useCallback } from 'react';
import { UploadIcon } from './Icons';
import { SheetData } from '../types';

interface FileUploadProps {
    onFileProcessed: (headers: string[], data: SheetData, fileName: string, worksheet: any) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string) => void;
}

declare const XLSX: any;

const FileUpload: React.FC<FileUploadProps> = ({ onFileProcessed, setLoading, setError }) => {

    const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setLoading(true);
        setError('');
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'array', cellStyles: true });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json: (string|number|null)[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null });

                if (json.length === 0) {
                    throw new Error("Выбранный файл пуст или не может быть прочитан.");
                }

                const headers = json[0] ? json[0].map(h => String(h ?? '')) : [];
                const sheetData = json.slice(1);

                onFileProcessed(headers, sheetData, file.name, worksheet);
            } catch (err) {
                console.error(err);
                setError("Не удалось обработать файл. Убедитесь, что это действительный файл XLS или XLSX.");
            } finally {
                setLoading(false);
            }
        };

        reader.onerror = () => {
            setError("Не удалось прочитать файл.");
            setLoading(false);
        }

        reader.readAsArrayBuffer(file);
    }, [onFileProcessed, setLoading, setError]);

    return (
        <div className="flex flex-col items-center justify-center h-full p-4 text-center">
            <div className="max-w-md w-full">
                <h1 className="text-3xl font-bold text-gray-100 mb-2">Редактор XLSX Lite</h1>
                <p className="text-gray-300 mb-6">Открывайте, ищите и выделяйте ячейки в ваших таблицах. Адаптировано для мобильных устройств.</p>
                <label
                    htmlFor="file-upload"
                    className="flex flex-col items-center justify-center w-full h-48 px-4 transition bg-gray-900 border-2 border-gray-600 border-dashed rounded-md appearance-none cursor-pointer hover:border-yellow-400 focus:outline-none"
                >
                    <UploadIcon className="w-12 h-12 text-gray-500" />
                    <span className="mt-2 text-base font-medium text-gray-300">
                        Нажмите, чтобы выбрать файл XLS или XLSX
                    </span>
                    <span className="text-sm text-gray-400">
                        Ваш файл обрабатывается локально в браузере.
                    </span>
                    <input
                        id="file-upload"
                        type="file"
                        className="sr-only"
                        accept=".xlsx, .xls"
                        onChange={handleFileChange}
                    />
                </label>
            </div>
        </div>
    );
};

export default FileUpload;