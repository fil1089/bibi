
import React, { useCallback } from 'react';
import { UploadIcon } from './Icons';
import { SheetData } from '../types';

interface FileUploadProps {
    onFileProcessed: (headers: string[], data: SheetData, fileName: string, worksheet: any) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string) => void;
}

declare const ExcelJS: any;

const FileUpload: React.FC<FileUploadProps> = ({ onFileProcessed, setLoading, setError }) => {

    const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setLoading(true);
        setError('');

        try {
            const buffer = await file.arrayBuffer();
            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.load(buffer);

            const worksheet = workbook.worksheets[0];
            if (!worksheet) {
                setError('Файл не содержит листов');
                setLoading(false);
                return;
            }

            // Извлечь заголовки
            const headers: string[] = [];
            const headerRow = worksheet.getRow(1);
            headerRow.eachCell({ includeEmpty: true }, (cell: any) => {
                headers.push(String(cell.value ?? ''));
            });

            // Извлечь данные
            const data: SheetData = [];
            for (let i = 2; i <= worksheet.rowCount; i++) {
                const row = worksheet.getRow(i);
                const rowData: (string | number | boolean | null)[] = [];
                
                for (let j = 1; j <= headers.length; j++) {
                    const cell = row.getCell(j);
                    rowData.push(cell.value ?? null);
                }
                
                data.push(rowData);
            }

            onFileProcessed(headers, data, file.name, worksheet);
        } catch (err) {
            console.error('Ошибка загрузки:', err);
            setError('Не удалось загрузить файл');
        } finally {
            setLoading(false);
        }
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