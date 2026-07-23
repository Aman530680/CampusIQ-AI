import { useState, useRef } from 'react'
import { Upload, Play, CheckCircle, AlertCircle, Loader } from 'lucide-react'
import { adminService } from '../../services'

export default function SettingsPage() {
  const [uploading, setUploading] = useState(false)
  const [training, setTraining] = useState(false)
  const [uploadMsg, setUploadMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [trainMsg, setTrainMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setUploadMsg(null)
    try {
      const res = await adminService.importDataset(file)
      setUploadMsg({ type: 'success', text: res.message })
    } catch (err: any) {
      setUploadMsg({ type: 'error', text: err.response?.data?.detail || 'Upload failed' })
    } finally {
      setUploading(false)
    }
  }

  const handleTrain = async () => {
    setTraining(true)
    setTrainMsg(null)
    try {
      const res = await adminService.trainModels()
      setTrainMsg({ type: 'success', text: res.message })
    } catch (err: any) {
      setTrainMsg({ type: 'error', text: err.response?.data?.detail || 'Training failed' })
    } finally {
      setTraining(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Dataset Import */}
      <div className="card">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Import Dataset</h3>
        <p className="text-sm text-gray-500 mb-4">Upload the CampusIQ Excel dataset to populate the database via ETL pipeline.</p>
        <div
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-8 text-center cursor-pointer hover:border-primary-400 transition-colors"
        >
          <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600 dark:text-gray-400">Click to upload Excel file (.xlsx)</p>
          <p className="text-xs text-gray-400 mt-1">CampusIQ_20000_Students_Dataset.xlsx</p>
        </div>
        <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleUpload} />
        {uploading && (
          <div className="flex items-center gap-2 mt-3 text-sm text-primary-600">
            <Loader className="w-4 h-4 animate-spin" /> Processing dataset...
          </div>
        )}
        {uploadMsg && (
          <div className={`flex items-center gap-2 mt-3 text-sm ${uploadMsg.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
            {uploadMsg.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {uploadMsg.text}
          </div>
        )}
      </div>

      {/* Model Training */}
      <div className="card">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Train ML Models</h3>
        <p className="text-sm text-gray-500 mb-4">Train CGPA predictor, risk classifier, and placement predictor using current data.</p>
        <button onClick={handleTrain} disabled={training} className="btn-primary flex items-center gap-2">
          {training ? <Loader className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          {training ? 'Training in progress...' : 'Start Training'}
        </button>
        {trainMsg && (
          <div className={`flex items-center gap-2 mt-3 text-sm ${trainMsg.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
            {trainMsg.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {trainMsg.text}
          </div>
        )}
      </div>

      {/* System Info */}
      <div className="card">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">System Information</h3>
        <div className="space-y-2 text-sm">
          {[
            ['Application', 'CampusIQ AI v1.0.0'],
            ['Backend', 'FastAPI + SQLAlchemy'],
            ['Database', 'MySQL'],
            ['ML Framework', 'XGBoost + LightGBM + SHAP'],
            ['Frontend', 'React + TypeScript + Tailwind CSS'],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between py-2 border-b border-gray-50 dark:border-gray-800">
              <span className="text-gray-500">{k}</span>
              <span className="font-medium text-gray-900 dark:text-white">{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
