import * as React from 'react';
import Button from '@mui/material/Button';
import DeleteIcon from '@mui/icons-material/Delete';
import InsightsIcon from '@mui/icons-material/Insights';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { dataSet } from '../types/dataset';


interface DatasetToolProps {
  currentDataset: dataSet | undefined;
  handleDelete: (dataset_id: string) => void;
}

const buttonStyle = {
    borderColor: '#ccc',
    color: '#666',
    '&:hover': {
      borderColor: '#999',
      backgroundColor: 'rgba(0, 0, 0, 0.04)'
    }
  };

export function DatasetTools({currentDataset, handleDelete}: DatasetToolProps) {
    const [open, setOpen] = React.useState(false);

    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    const handleDoDelete = (_: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        if (currentDataset) {
            handleDelete(currentDataset.id);
        }
        setOpen(false);
    }

    return (
        <React.Fragment>
            <div style={{ 
                fontSize: '16px',
                fontWeight: 500,
                color: '#333',
                display: 'flex',
                gap: '8px',
                justifyContent: 'flex-end'
            }}>
                <Button 
                    //variant="outlined" 
                    startIcon={<DeleteIcon />}
                    size="small" 
                    onClick={handleClickOpen}
                    sx={{buttonStyle}}
                >
                    Delete
                </Button>
                <Button 
                    //variant="outlined" 
                    startIcon={<InsightsIcon/>}
                    size="small" 
                    //onClick={handleOpenAdd}
                    sx={{buttonStyle}}
                >
                    Forecast
                </Button>          
            </div>
            <Dialog
                open={open}
                onClose={handleClose}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title">
                {"Delete dataset?"}
                </DialogTitle>
                <DialogContent>
                <DialogContentText id="alert-dialog-description">
                    This will delete the dataset from storage and remove any operations or forecasts associated with it. This action cannot be undone.
                </DialogContentText>
                </DialogContent>
                <DialogActions>
                <Button onClick={handleClose}>Cancel</Button>
                <Button onClick={handleDoDelete} autoFocus>
                    Delete
                </Button>
                </DialogActions>
            </Dialog>
        </React.Fragment>
    )
}
