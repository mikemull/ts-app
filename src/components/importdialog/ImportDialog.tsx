import * as React from 'react';
import { useState } from 'react'
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { dataSet } from '../../types/dataset';

interface IDialogType {
  title: string;
  desc: string;
}

type DialogProps = { [id: string]: IDialogType; };

const dialogProps: DialogProps  = {
  "import": { title: "Import", desc: "Select a CSV file to import.  An import will try to identify timestamp columns and time series columns."},
  "add": { title: "Add", desc: "Add a parquet file" }
};


interface ImportDialogProps {
  open: boolean;
  uploadType: string;
  onClose: () => void;
  addDataset: (dataSet: dataSet) => void;
}

interface DatasetModalData {
  dataset_name: string;
  filepath: string;
}

const dialogStyle = {
  '& .MuiPaper-root': {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    color: '#333',
    minWidth: '600px'
  }
};

const contentStyle = {
  '& .MuiDialogContentText-root': {
    color: '#666',
    fontSize: '14px',
    marginBottom: '20px'
  },
  '& .MuiTextField-root': {
    marginBottom: '16px',
    '& .MuiInputLabel-root': {
      color: '#666'
    },
    '& .MuiInput-root': {
      '&:before': {
        borderColor: '#ccc'
      },
      '&:hover:not(.Mui-disabled):before': {
        borderColor: '#999'
      }
    }
  }
};

const fileInputContainerStyle = {
  marginTop: '16px',
  display: 'flex',
  flexDirection: 'column' as const,
  gap: '8px'
};

const fileInputLabelStyle = {
  color: '#666',
  fontSize: '14px',
  marginBottom: '4px'
};

const fileInputStyle = {
  position: 'relative' as const,
  '& input[type="file"]': {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '8px 16px',
    backgroundColor: '#f5f5f5',
    border: '1px solid #ccc',
    borderRadius: '4px',
    color: '#666',
    fontSize: '14px',
    cursor: 'pointer',
    width: '100%',
    '&:hover': {
      backgroundColor: 'rgba(0, 0, 0, 0.04)',
      borderColor: '#999'
    },
    '&::-webkit-file-upload-button': {
      display: 'none'
    }
  },
  '& .file-name': {
    marginTop: '8px',
    color: '#666',
    fontSize: '14px',
    fontStyle: 'italic'
  }
};

const actionStyle = {
  padding: '16px 24px',
  gap: '8px'
};

const buttonStyle = {
  textTransform: 'none' as const,
  padding: '6px 16px',
  borderRadius: '4px',
  fontSize: '14px',
  fontWeight: 500
};


export const ImportDialog: React.FC<ImportDialogProps> = ({ open, uploadType, onClose, addDataset }) => {
  const [file, setFile] = useState<File | null>(null);
  const [modalData, setModalData] = useState<DatasetModalData>({ dataset_name: '', filepath: ''});
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setModalData({ ...modalData, [name]: value});
    console.log(modalData);
  };
  
  const handleUpload = async (event: React.MouseEvent<HTMLButtonElement>, upload_type: string) => {
    if (file) {
      event.preventDefault();
      console.log('Uploading file...');
  
      const dsFormData = new FormData();
      dsFormData.append('name', modalData.dataset_name);
      dsFormData.append('file', file);
      dsFormData.append('upload_type', upload_type);
  
      try {
        const result = await fetch('/tsapi/v1/files', {
          method: 'POST',
          body: dsFormData,
        });

        if (!result.ok) {
          const error = await result.json();
          throw new Error(`HTTP error! status: ${result.status} - ${error.detail}`);
        }

        const data = await result.json();
        addDataset(data as dataSet);
        onClose();
      } catch (error) {
        alert(error);
      }
    }
  };


  return (
    <React.Fragment>
      <Dialog
        open={open}
        onClose={onClose}
        sx={dialogStyle}
        slotProps={{
          paper: {
            component: 'form',
          },
        }}
      >
        <DialogTitle sx={{
          fontSize: '18px',
          fontWeight: 500,
          color: '#333',
          padding: '20px 24px',
          borderBottom: '1px solid #eee',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>{dialogProps[uploadType].title}</div>
        </DialogTitle>
        <DialogContent sx={contentStyle}>
          <DialogContentText>
            {dialogProps[uploadType].desc}
          </DialogContentText>
          <TextField
            autoFocus
            required
            margin="dense"
            id="dataset_name"
            name="dataset_name"
            label="Dataset Name"
            type="text"
            fullWidth
            variant="standard"
            onChange={handleChange}
          />
          <div style={fileInputContainerStyle}>
            <div style={fileInputLabelStyle}>Select File</div>
            <div style={fileInputStyle}>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileChange}
                accept={uploadType === 'import' ? '.csv' : '.parquet'}
              />
              {file && <div className="file-name">Selected: {file.name}</div>}
            </div>
          </div>
        </DialogContent>
        <DialogActions sx={actionStyle}>
          <Button 
            onClick={onClose}
            sx={{
              ...buttonStyle,
              color: '#666',
              borderColor: '#ccc',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
                borderColor: '#999'
              }
            }}
            variant="outlined"
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            onClick={(event) => handleUpload(event, uploadType)}
            sx={{
              ...buttonStyle,
              backgroundColor: '#1976d2',
              color: '#fff',
              '&:hover': {
                backgroundColor: '#1565c0'
              }
            }}
            variant="contained"
            disabled={!file || !modalData.dataset_name}
          >
            {uploadType === 'import' ? 'Import' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </React.Fragment>
  );
}
