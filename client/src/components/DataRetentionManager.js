import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const DataRetentionManager = () => {
  const [retentionData, setRetentionData] = useState(null);
  const [selectedDays, setSelectedDays] = useState(90);
  const [previewData, setPreviewData] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [useCustomDates, setUseCustomDates] = useState(false);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [customPreviewData, setCustomPreviewData] = useState(null);

  const retentionOptions = [
    { value: 30, label: '30 days' },
    { value: 60, label: '60 days' },
    { value: 90, label: '90 days' },
    { value: 180, label: '180 days' },
    { value: 365, label: '1 year' }
  ];

  // Fetch retention summary
  const fetchRetentionSummary = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        'http://localhost:5000/api/admin/video-analytics/data-retention/summary',
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setRetentionData(response.data);
    } catch (error) {
      console.error('Error fetching retention summary:', error);
    }
  };

  // Fetch preview of deletion
  const fetchPreview = async (days) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:5000/api/admin/video-analytics/data-retention/preview?olderThanDays=${days}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setPreviewData(response.data);
    } catch (error) {
      console.error('Error fetching preview:', error);
      setMessage({ type: 'error', text: 'Failed to load preview data' });
    } finally {
      setLoading(false);
    }
  };

  // Delete old data
  const handleDelete = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:5000/api/admin/video-analytics/data-retention/delete',
        {
          deleteOlderThanDays: selectedDays,
          confirm: true
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setMessage({
          type: 'success',
          text: `Successfully deleted ${response.data.deletedRecords} records. ${response.data.remainingRecords} records remaining.`
        });
        setShowConfirmModal(false);
        setPreviewData(null);
        fetchRetentionSummary();
      }
    } catch (error) {
      console.error('Error deleting data:', error);
      setMessage({ type: 'error', text: 'Failed to delete data' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRetentionSummary();
  }, []);

  useEffect(() => {
    if (selectedDays && !useCustomDates) {
      fetchPreview(selectedDays);
    }
  }, [selectedDays]);

  useEffect(() => {
    if (useCustomDates && startDate && endDate) {
      fetchCustomPreview();
    }
  }, [useCustomDates, startDate, endDate]);

  // Fetch custom date range preview
  const fetchCustomPreview = async () => {
    if (!startDate || !endDate) return;
    
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:5000/api/admin/video-analytics/data-retention/custom-preview?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setCustomPreviewData(response.data);
      setPreviewData(null);
    } catch (error) {
      console.error('Error fetching custom preview:', error);
      setMessage({ type: 'error', text: 'Failed to load custom date range preview' });
    } finally {
      setLoading(false);
    }
  };

  // Handle custom date deletion
  const handleCustomDelete = async () => {
    if (!startDate || !endDate) return;
    
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:5000/api/admin/video-analytics/data-retention/custom-delete',
        {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          confirm: true
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setMessage({
          type: 'success',
          text: `Successfully deleted ${response.data.deletedRecords} records. ${response.data.remainingRecords} records remaining.`
        });
        setShowConfirmModal(false);
        setCustomPreviewData(null);
        setStartDate(null);
        setEndDate(null);
        fetchRetentionSummary();
      }
    } catch (error) {
      console.error('Error deleting custom date range:', error);
      setMessage({ type: 'error', text: 'Failed to delete data' });
    } finally {
      setLoading(false);
    }
  };

  // Handle download before delete
  const handleDownloadBeforeDelete = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/admin/video-analytics/export', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `video-analytics-backup-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setMessage({ type: 'success', text: 'Data exported successfully! You can now safely delete.' });
    } catch (error) {
      console.error('Failed to export analytics:', error);
      setMessage({ type: 'error', text: 'Failed to export data' });
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', padding: '2rem', marginTop: '2rem' }}>
      <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#2d3748', marginBottom: '1.5rem', borderBottom: '2px solid #667eea', paddingBottom: '0.5rem' }}>📊 Data Retention Management</h3>

      {/* Message Display */}
      {message && (
        <div
          style={{
            marginBottom: '1.5rem',
            padding: '1rem',
            borderRadius: '8px',
            backgroundColor: message.type === 'success' ? '#f0fdf4' : '#fef2f2',
            color: message.type === 'success' ? '#166534' : '#991b1b',
            border: `1px solid ${message.type === 'success' ? '#86efac' : '#fca5a5'}`
          }}
        >
          <p style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
            {message.type === 'success' ? '✅' : '❌'} {message.text}
          </p>
          <button
            onClick={() => setMessage(null)}
            style={{
              fontSize: '0.875rem',
              textDecoration: 'underline',
              marginTop: '0.5rem',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'inherit'
            }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Database Statistics */}
      {retentionData && (
        <div style={{ marginBottom: '2rem' }}>
          <h4 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#4a5568', marginBottom: '1rem' }}>📈 Database Statistics</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-600">Total Records</p>
              <p className="text-2xl font-bold text-blue-800">{retentionData.totalRecords.toLocaleString()}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <p className="text-sm text-green-600">Oldest Record</p>
              <p className="text-lg font-semibold text-green-800">{formatDate(retentionData.oldestRecord)}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <p className="text-sm text-purple-600">Newest Record</p>
              <p className="text-lg font-semibold text-purple-800">{formatDate(retentionData.newestRecord)}</p>
            </div>
          </div>

          {/* Records by Age */}
          <div className="mt-4">
            <p className="text-sm font-semibold text-gray-700 mb-2">Records by Age:</p>
            <div className="space-y-2">
              {retentionData.recordsByAge.map((item, index) => (
                <div key={index} className="flex items-center gap-4">
                  <span className="text-sm text-gray-600 w-24">{item.ageInDays} days:</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-6 overflow-hidden">
                    <div
                      className="bg-blue-500 h-full flex items-center justify-end pr-2"
                      style={{
                        width: `${(item.count / retentionData.totalRecords) * 100}%`,
                        minWidth: item.count > 0 ? '30px' : '0'
                      }}
                    >
                      <span className="text-xs text-white font-semibold">
                        {item.count.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <span className="text-sm text-gray-500 w-12 text-right">
                    {((item.count / retentionData.totalRecords) * 100).toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Retention Policy Selector */}
      <div style={{ marginBottom: '1.5rem', borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem' }}>
        <h4 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#4a5568', marginBottom: '1rem' }}>⏱️ Data Retention Policy</h4>
        
        {/* Toggle between preset and custom dates */}
        <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button
            onClick={() => { setUseCustomDates(false); setCustomPreviewData(null); }}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              border: '2px solid',
              borderColor: !useCustomDates ? '#667eea' : '#e2e8f0',
              backgroundColor: !useCustomDates ? '#667eea' : 'white',
              color: !useCustomDates ? 'white' : '#4a5568',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            📅 Quick Policies
          </button>
          <button
            onClick={() => { setUseCustomDates(true); setPreviewData(null); }}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              border: '2px solid',
              borderColor: useCustomDates ? '#667eea' : '#e2e8f0',
              backgroundColor: useCustomDates ? '#667eea' : 'white',
              color: useCustomDates ? 'white' : '#4a5568',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            📆 Custom Date Range
          </button>
        </div>

        {!useCustomDates ? (
          <>
            <p style={{ fontSize: '0.875rem', color: '#718096', marginBottom: '1rem' }}>
              Select how long you want to keep video analytics data. Older data will be permanently deleted.
            </p>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
              {retentionOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSelectedDays(option.value)}
                  style={{
                    padding: '0.75rem 1.25rem',
                    borderRadius: '8px',
                    border: '2px solid',
                    borderColor: selectedDays === option.value ? '#667eea' : '#e2e8f0',
                    backgroundColor: selectedDays === option.value ? '#667eea' : 'white',
                    color: selectedDays === option.value ? 'white' : '#4a5568',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedDays !== option.value) {
                      e.target.style.borderColor = '#a5b4fc';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedDays !== option.value) {
                      e.target.style.borderColor = '#e2e8f0';
                    }
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <p style={{ fontSize: '0.875rem', color: '#718096', marginBottom: '1rem' }}>
              Select a custom date range to delete or download video analytics data for specific dates.
            </p>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#4a5568', marginBottom: '0.5rem' }}>
                  From Date:
                </label>
                <DatePicker
                  selected={startDate}
                  onChange={(date) => setStartDate(date)}
                  maxDate={endDate || new Date()}
                  dateFormat="MMM d, yyyy"
                  placeholderText="Select start date"
                  className="w-full"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e2e8f0',
                    borderRadius: '6px',
                    fontSize: '0.875rem'
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#4a5568', marginBottom: '0.5rem' }}>
                  To Date:
                </label>
                <DatePicker
                  selected={endDate}
                  onChange={(date) => setEndDate(date)}
                  minDate={startDate}
                  maxDate={new Date()}
                  dateFormat="MMM d, yyyy"
                  placeholderText="Select end date"
                  className="w-full"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e2e8f0',
                    borderRadius: '6px',
                    fontSize: '0.875rem'
                  }}
                />
              </div>
            </div>

            {startDate && endDate && (
              <div style={{ padding: '1rem', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '6px', marginTop: '1rem' }}>
                <p style={{ fontSize: '0.875rem', color: '#1e40af', margin: 0 }}>
                  📅 Selected Range: <strong>{formatDate(startDate.toISOString())}</strong> to <strong>{formatDate(endDate.toISOString())}</strong>
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Preview Section */}
      {(previewData || customPreviewData) && !loading && (
        <div style={{ marginBottom: '1.5rem', borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem' }}>
          <h4 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#4a5568', marginBottom: '1rem' }}>🔍 Deletion Preview</h4>
          
          <div style={{ backgroundColor: '#fef9c3', border: '1px solid #fde047', borderRadius: '8px', padding: '1rem', marginBottom: '1rem' }}>
            <p style={{ fontSize: '0.875rem', color: '#854d0e', marginBottom: '0.5rem', margin: 0 }}>
              ⚠️ <strong>Warning:</strong> This action cannot be undone!
            </p>
            <p style={{ fontSize: '0.875rem', color: '#92400e', margin: 0 }}>
              Deleting old data will permanently remove records from your database.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div style={{ backgroundColor: '#fef2f2', padding: '1rem', borderRadius: '8px', border: '1px solid #fecaca' }}>
              <p style={{ fontSize: '0.875rem', color: '#991b1b', margin: '0 0 0.5rem 0' }}>Will Delete</p>
              <p style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#7f1d1d', margin: 0 }}>
                {(previewData?.wouldDelete || customPreviewData?.wouldDelete || 0).toLocaleString()}
              </p>
              <p style={{ fontSize: '0.75rem', color: '#991b1b', marginTop: '0.25rem', margin: 0 }}>records</p>
            </div>
            <div style={{ backgroundColor: '#f0fdf4', padding: '1rem', borderRadius: '8px', border: '1px solid #86efac' }}>
              <p style={{ fontSize: '0.875rem', color: '#166534', margin: '0 0 0.5rem 0' }}>Will Retain</p>
              <p style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#14532d', margin: 0 }}>
                {(previewData?.wouldRetain || customPreviewData?.wouldRetain || 0).toLocaleString()}
              </p>
              <p style={{ fontSize: '0.75rem', color: '#166534', marginTop: '0.25rem', margin: 0 }}>records</p>
            </div>
            <div style={{ backgroundColor: '#f9fafb', padding: '1rem', borderRadius: '8px', border: '1px solid #d1d5db' }}>
              <p style={{ fontSize: '0.875rem', color: '#4b5563', margin: '0 0 0.5rem 0' }}>Date Range</p>
              <p style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1f2937', margin: 0 }}>
                {formatDate((previewData?.affectedDateRange || customPreviewData?.affectedDateRange)?.from)}
              </p>
              <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '0.25rem 0' }}>to</p>
              <p style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1f2937', margin: 0 }}>
                {formatDate((previewData?.affectedDateRange || customPreviewData?.affectedDateRange)?.to)}
              </p>
            </div>
          </div>

          <div style={{ marginTop: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
            <button
              onClick={handleDownloadBeforeDelete}
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                fontWeight: '600',
                transition: 'all 0.2s',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#059669'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#10b981'}
            >
              📥 Download Data First
            </button>
            
            <button
              onClick={() => setShowConfirmModal(true)}
              disabled={(previewData?.wouldDelete || customPreviewData?.wouldDelete || 0) === 0 || loading}
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                fontWeight: '600',
                transition: 'all 0.2s',
                backgroundColor: (previewData?.wouldDelete || customPreviewData?.wouldDelete || 0) === 0 || loading ? '#d1d5db' : '#dc2626',
                color: (previewData?.wouldDelete || customPreviewData?.wouldDelete || 0) === 0 || loading ? '#9ca3af' : 'white',
                border: 'none',
                cursor: (previewData?.wouldDelete || customPreviewData?.wouldDelete || 0) === 0 || loading ? 'not-allowed' : 'pointer'
              }}
              onMouseEnter={(e) => {
                if (!((previewData?.wouldDelete || customPreviewData?.wouldDelete || 0) === 0 || loading)) {
                  e.target.style.backgroundColor = '#b91c1c';
                }
              }}
              onMouseLeave={(e) => {
                if (!((previewData?.wouldDelete || customPreviewData?.wouldDelete || 0) === 0 || loading)) {
                  e.target.style.backgroundColor = '#dc2626';
                }
              }}
            >
              {loading ? 'Processing...' : `🗑️ Delete ${(previewData?.wouldDelete || customPreviewData?.wouldDelete || 0).toLocaleString()} Records`}
            </button>
            
            <button
              onClick={fetchRetentionSummary}
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                fontWeight: '600',
                border: '2px solid #d1d5db',
                backgroundColor: 'white',
                color: '#4b5563',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#f9fafb'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
            >
              🔄 Refresh Stats
            </button>
          </div>
        </div>
      )}

      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '2rem', maxWidth: '500px', width: '90%', margin: '1rem' }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#dc2626', marginBottom: '1rem' }}>⚠️ Confirm Deletion</h3>
            <p style={{ color: '#4b5563', marginBottom: '1rem' }}>
              You are about to permanently delete <strong>{(previewData?.wouldDelete || customPreviewData?.wouldDelete || 0).toLocaleString()} records</strong>
              {useCustomDates ? (
                <> from <strong>{formatDate(startDate?.toISOString())}</strong> to <strong>{formatDate(endDate?.toISOString())}</strong></>
              ) : (
                <> older than <strong>{selectedDays} days</strong></>
              )}.
            </p>
            <p style={{ color: '#4b5563', marginBottom: '1.5rem' }}>
              This action <strong style={{ color: '#dc2626' }}>CANNOT</strong> be undone. Are you absolutely sure?
            </p>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={useCustomDates ? handleCustomDelete : handleDelete}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '0.75rem 1.5rem',
                  backgroundColor: loading ? '#d1d5db' : '#dc2626',
                  color: 'white',
                  borderRadius: '8px',
                  fontWeight: '600',
                  border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? 'Deleting...' : 'Yes, Delete Permanently'}
              </button>
              <button
                onClick={() => setShowConfirmModal(false)}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '0.75rem 1.5rem',
                  backgroundColor: loading ? '#f3f4f6' : '#e5e7eb',
                  color: '#374151',
                  borderRadius: '8px',
                  fontWeight: '600',
                  border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataRetentionManager;
