import { useEffect, useState } from 'react'
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Select, { SelectChangeEvent } from '@mui/material/Select';

interface ForecastDialogProps {
  open: boolean;
  series_ids: string[];
  handleClose: () => void;
  doForecast: (series_id: string, horizon: number) => void;
}

export function ForecastDialog({ open, series_ids, handleClose, doForecast}: ForecastDialogProps) {
  const [series_id, setSeriesId] = useState("");
  const [horizon, setHorizon] = useState(5);

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
      if (series_id) {
          doForecast(series_id, horizon);
          handleClose();
      }
  };

  useEffect(() => {
      if (open) {
          setSeriesId(series_ids[0]);
          setHorizon(5);
      }
  }, [open, series_ids]);

  return (

    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>Forecast</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Forecast the next values to the specified horizon.
        </DialogContentText>
        <Select onChange={handleChangeSelectedSeries} label="Series" fullWidth defaultValue={series_ids[0]}>
                        {series_ids.map((ts) => (
                            <MenuItem key={ts} value={ts}>
                                {ts}
                            </MenuItem>
                        ))}
        </Select>
        <TextField
          autoFocus
          margin="dense"
          id="horizon"
          label="Horizon"
          type="number"
          fullWidth
          variant="outlined"
          defaultValue={5}
          onChange={handleHorizonChange}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Close</Button>
        <Button onClick={handleDoForecast} disabled={!series_id}>Forecast</Button>
      </DialogActions>
    </Dialog>
  );
}
