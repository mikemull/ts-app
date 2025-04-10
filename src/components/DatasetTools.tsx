import * as React from 'react';
import Button from '@mui/material/Button';
import DeleteIcon from '@mui/icons-material/Delete';
import InsightsIcon from '@mui/icons-material/Insights';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { SelectChangeEvent } from '@mui/material/Select';
import { ForecastDialog } from './ForecastDialog';
import { dataSet } from '../types/dataset';
import { tsPoint } from '../types/timeseries';

interface DatasetToolProps {
  currentDataset: dataSet | undefined;
  handleDelete: (dataset_id: string) => void;
  setForecasts: React.Dispatch<React.SetStateAction<tsPoint[]>>;
}

const buttonStyle = {
    borderColor: '#ccc',
    color: '#666',
    '&:hover': {
      borderColor: '#999',
      backgroundColor: 'rgba(0, 0, 0, 0.04)'
    }
  };

export function DatasetTools({currentDataset, handleDelete, setForecasts}: DatasetToolProps) {
    const [open, setOpen] = React.useState(false);
    const [forecastOpen, setForecastOpen] = React.useState(false);
    const [series_id, setSeriesId] = React.useState("");
    const [horizon, setHorizon] = React.useState(5);

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

    const handleForecastOpen = () => {
        setForecastOpen(true);
    };

    const handleForecastClose = () => {
        setForecastOpen(false);
    };

    const handleChangeSelectedSeries = (event: SelectChangeEvent) => {
        setSeriesId(event.target.value as string);
    };

    const handleHorizonChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        if (value) {
            const parsedValue = parseInt(value, 10);
            if (!isNaN(parsedValue)) {
                setHorizon(parsedValue);
            }
        }
    };

    const handleDoForecast = async () => {
        // Handle forecast logic here
        console.log("Forecasting...");
        const resp = await fetch('/tsapi/v1/forecast', {
            method: 'post',
            headers: {'Content-Type':'application/json'},
            body: JSON.stringify({
              "opset_id": currentDataset?.ops[0].id,
              "series_id": series_id,
              "horizon": horizon,
            })
          });
          const jsonResp = await resp.json();
          setForecasts(jsonResp.forecast);
          console.log(jsonResp);

        setForecastOpen(false);
    };

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
                    startIcon={<InsightsIcon/>}
                    size="small" 
                    onClick={handleForecastOpen}
                    sx={{buttonStyle}}
                >
                    Forecast
                </Button>  
                <Button 
                    //variant="outlined" 
                    startIcon={<DeleteIcon />}
                    size="small" 
                    onClick={handleClickOpen}
                    sx={{buttonStyle}}
                >
                    Delete
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
            <ForecastDialog 
                open={forecastOpen}
                series_ids={currentDataset?.ops[0].plot || []}
                handleClose={handleForecastClose}
                handleDoForecast={handleDoForecast}
                handleChangeSelectedSeries={handleChangeSelectedSeries}
                handleHorizonChange={handleHorizonChange}
            />
        </React.Fragment>
    )
}
