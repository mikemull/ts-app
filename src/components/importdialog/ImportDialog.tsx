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
  upload_type: string;
}

export const ImportDialog: React.FC<ImportDialogProps> = ({ open, uploadType, onClose, addDataset }) => {
  const [file, setFile] = useState<File | null>(null);
  const [modalData, setModalData] = useState<DatasetModalData>({ dataset_name: '', filepath: '', upload_type: '' });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, uptype: string) => {
    const { name, value } = event.target;
    setModalData({ ...modalData, [name]: value, upload_type: uptype });
    console.log(modalData);
  };
  
  const handleUpload = async () => {
    if (file) {
      console.log('Uploading file...');
  
      const dsFormData = new FormData();
      dsFormData.append('name', modalData.dataset_name);
      dsFormData.append('file', file);
      dsFormData.append('upload_type', modalData.upload_type);
  
      try {
        const result = await fetch('/tsapi/v1/files', {
          method: 'POST',
          body: dsFormData,
        });
  
        const data = await result.json();
        console.log(data);
        addDataset(data);
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
            onChange={(event) => {handleChange(event, uploadType)}}
          />
          <TextField type="file" onChange={handleFileChange} />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit"  onClick={handleUpload}>Import</Button>
        </DialogActions>
      </Dialog>
    </React.Fragment>
  );
}
