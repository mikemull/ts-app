import { TreeViewBaseItem } from '@mui/x-tree-view/models';
import { TreeItem2, TreeItem2Props } from '@mui/x-tree-view/TreeItem2';
import { useTreeItem2Utils } from '@mui/x-tree-view/hooks';
import { RichTreeView } from '@mui/x-tree-view/RichTreeView';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import { dataSet } from '../types/dataset';

interface DatasetPanelProps {
  datasets: dataSet[];
  currentDataset: dataSet | undefined;
  selectedDsetIndex: number;
  selectedItems: string[];
  expandedItems: string[];
  onDatasetClick: (event: React.MouseEvent<HTMLDivElement, MouseEvent>, index: number) => void;
  onTreeClick: (event: React.SyntheticEvent, itemIds: string[]) => void;
  handleExpandedItemsChange: (event: React.SyntheticEvent, itemIds: string[]) => void;
  handleOpenAdd: () => void;
  handleOpenImport: () => void;
}

interface TypedTreeItem extends TreeViewBaseItem {
  nodeType: string; 
}

const catIds = new Set<string>(['ts_col_time', 'ts_col_series', 'ts_col_other']);

export function isPlottable(ds: dataSet | undefined, itemId: string): boolean {
  return findItemParent(ds, itemId) == "ts_col_series";
}

function findItemParent(ds: dataSet | undefined, itemId: string): string | null {
  if (ds != undefined) {
    if (ds.series_cols.find((id) => id === itemId) != undefined) {
      return "ts_col_series";
    } else if (ds.timestamp_cols.find((id) => id === itemId) != undefined) {
      return "ts_col_time";
    } else {
      return null;
    }
  } else {
    return null;
  }
}

function makeTreeItem(ds: dataSet | undefined): TypedTreeItem[] {
  if (ds != undefined) {
    const groups = [
      {
        id: "ts_col_time",
        label: "Time Columns",
        nodeType: "ds",
        children: ds.timestamp_cols.map((s_id) => ({id: s_id, label: s_id}))
      },
      {
        id: "ts_col_series",
        label: "Numeric Columns",
        nodeType: "ds",
        children: ds.series_cols.map((s_id) => ({id: s_id, label: s_id}))
      }
    ]
    if (ds.other_cols.length > 0) {
      groups.push({
        id: "ts_other_series",
        label: "Other Columns",
        nodeType: "ds",
        children: ds.other_cols.map((s_id) => ({id: s_id, label: s_id}))
      });
    }
    return groups;
  } else {
    return []
  }
}

function CustomTreeItem(props: TreeItem2Props) {
  const { status } = useTreeItem2Utils({
    itemId: props.itemId,
    children: props.children,
  });

  return (
    <TreeItem2
      {...props}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      slotProps={{ checkbox: { visible: !status.expandable } as any }}
    />
  );
}

const panelStyle = {
  backgroundColor: '#f8f9fa',
  borderRadius: '8px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  margin: '20px',
  width: '300px',
  display: 'flex',
  flexDirection: 'column' as const
};

const headerStyle = {
  padding: '15px 20px',
  borderBottom: '1px solid #eee',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  backgroundColor: '#ffffff'
};

export function DatasetPanel({
  datasets,
  currentDataset,
  selectedDsetIndex,
  selectedItems,
  expandedItems,
  onDatasetClick,
  onTreeClick,
  handleExpandedItemsChange,
  handleOpenAdd,
  handleOpenImport
}: DatasetPanelProps) {
  return (
    <div style={panelStyle}>
      <div style={headerStyle}>
        <div style={{ 
          fontSize: '16px',
          fontWeight: 500,
          color: '#333'
        }}>
          Datasets
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button 
            variant="outlined" 
            size="small" 
            onClick={handleOpenAdd}
            sx={{
              borderColor: '#ccc',
              color: '#666',
              '&:hover': {
                borderColor: '#999',
                backgroundColor: 'rgba(0, 0, 0, 0.04)'
              }
            }}
          >
            Add
          </Button>
          <Button 
            variant="outlined" 
            size="small" 
            onClick={handleOpenImport}
            sx={{
              borderColor: '#ccc',
              color: '#666',
              '&:hover': {
                borderColor: '#999',
                backgroundColor: 'rgba(0, 0, 0, 0.04)'
              }
            }}
          >
            Import
          </Button>
        </div>
      </div>
      <div style={{ flex: 1, overflow: 'hidden', backgroundColor: '#f8f9fa' }}>
        <Box sx={{
          height: 'calc(100vh - 140px)',
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          overflowY: "auto",
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: '#f0f0f0',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: '#ddd',
            borderRadius: '4px',
          }
        }}>
          <List sx={{
            bgcolor: 'transparent',
            '& .MuiListItemText-primary': {
              fontSize: '14px',
              fontWeight: 500,
              color: '#333'
            },
            '& .MuiListItemButton-root': {
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)'
              },
              '&.Mui-selected': {
                backgroundColor: 'rgba(0, 0, 0, 0.08)',
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.12)'
                }
              }
            }
          }}>
            {datasets.map((ds, idx) =>
              <ListItem disablePadding key={idx}>
                <ListItemButton onClick={(event) => {onDatasetClick(event, idx)}} selected={selectedDsetIndex === idx}>
                  <ListItemText primary={ds.name}/>
                </ListItemButton>
              </ListItem>
            )} 
          </List>
          <Divider sx={{ margin: '8px 0' }}/>
          <RichTreeView
            multiSelect
            items={currentDataset ? makeTreeItem(currentDataset) : []}
            checkboxSelection
            defaultExpandedItems={Array.from(catIds)}
            selectedItems={selectedItems}
            expandedItems={expandedItems}
            onExpandedItemsChange={handleExpandedItemsChange}
            onSelectedItemsChange={onTreeClick}
            slots={{ item: CustomTreeItem }}
            sx={{
              '& .MuiTreeItem-label': {
                fontSize: '14px',
                fontWeight: 500,
                color: '#333'
              },
              '& .MuiTreeItem-group': {
                marginLeft: '8px'
              },
              '& .MuiTreeItem-content': {
                padding: '4px 8px',
                borderRadius: '4px',
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.04)'
                },
                '&.Mui-selected': {
                  backgroundColor: 'rgba(0, 0, 0, 0.08)',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.12)'
                  }
                }
              },
              '& .MuiTreeItem-iconContainer': {
                '& svg': {
                  color: '#666',
                  fontSize: '20px'
                }
              }
            }}
          />
        </Box>
      </div>
    </div>
  );
} 