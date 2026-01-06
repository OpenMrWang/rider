import { useRef } from 'react';
import { useTripDataContext } from '../context/TripDataContext';

export function DataManager() {
  const { tripData, handleImport, handleExport, handleReset } = useTripDataContext();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('[DataManager] 文件选择事件触发', event);
    const file = event.target.files?.[0];
    if (!file) {
      console.warn('[DataManager] 未选择文件');
      return;
    }

    console.log('[DataManager] 选择的文件:', {
      name: file.name,
      size: file.size,
      type: file.type,
    });

    const reader = new FileReader();
    
    reader.onload = (e) => {
      console.log('[DataManager] 文件读取完成');
      const content = e.target?.result as string;
      console.log('[DataManager] 文件内容长度:', content.length);
      console.log('[DataManager] 文件内容预览:', content.substring(0, 200));
      
      try {
        const success = handleImport(content);
        console.log('[DataManager] 导入结果:', success);
        if (success) {
          console.log('[DataManager] 导入成功，当前数据:', tripData);
          alert(`数据导入成功！共 ${tripData.days.length} 天的记录`);
        } else {
          console.error('[DataManager] 导入失败');
          alert('数据导入失败，请检查文件格式。请查看控制台获取详细信息。');
        }
      } catch (error) {
        console.error('[DataManager] 导入异常:', error);
        alert(`导入异常: ${error instanceof Error ? error.message : '未知错误'}`);
      }
    };

    reader.onerror = (error) => {
      console.error('[DataManager] 文件读取错误:', error);
      alert('文件读取失败，请重试');
    };

    reader.onabort = () => {
      console.warn('[DataManager] 文件读取被中止');
    };

    console.log('[DataManager] 开始读取文件...');
    reader.readAsText(file);
  };

  const handleExportClick = () => {
    const jsonString = handleExport();
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trip-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">数据管理</h2>
      <div className="space-y-4">
        <div>
          <p className="text-sm text-gray-600 mb-2">
            当前共有 <span className="font-semibold">{tripData.days.length}</span> 天的记录
          </p>
        </div>
        <div className="flex gap-4">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            导入 JSON
          </button>
          <button
            onClick={handleExportClick}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            导出 JSON
          </button>
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            重置数据
          </button>
        </div>
      </div>
    </div>
  );
}

