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
  handleDoForecast: () => void;
  handleChangeSelectedSeries: (event: SelectChangeEvent) => void;
  handleHorizonChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export function ForecastDialog({ open, series_ids, handleClose, handleDoForecast, handleChangeSelectedSeries, handleHorizonChange }: ForecastDialogProps) {
  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>Forecast</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Forecast the next values to the specified horizon.
        </DialogContentText>
        <Select onChange={handleChangeSelectedSeries} label="Series" fullWidth>
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
        <Button onClick={handleDoForecast}>Forecast</Button>
      </DialogActions>
    </Dialog>
  );
}
