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

export const ImportDialog: React.FC<ImportDialogProps> = ({ open, uploadType, onClose, addDataset }) => {
  const [file, setFile] = useState<File | null>(null);
  const [modalData, setModalData] = useState<DatasetModalData>({ dataset_name: '', filepath: ''});

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
        sx={{
          '& .MuiPaper-root': {
            background: 'rgb(51 65 85)',
            color: 'white'
          }
        }}
        slotProps={{
          paper: {
            component: 'form',
          },
        }}
      >
        <DialogTitle>{dialogProps[uploadType].title}</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{color:'white'}}>
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
          <TextField type="file" onChange={handleFileChange} />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" onClick={(event) => handleUpload(event, uploadType)}>Import</Button>
        </DialogActions>
      </Dialog>
    </React.Fragment>
  );
}
