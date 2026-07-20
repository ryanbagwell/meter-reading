'use client';

import {
  Box,
  Button,
  Checkbox,
  Drawer,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from '@mui/material';
import { meterLabel } from '@/lib/commodity';

interface MeterSelectorProps {
  open: boolean;
  onClose: () => void;
  endpoints: number[];
  selected: number[];
  endpointTypeById: Record<number, string | null>;
  onToggle: (id: number) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
}

export function MeterSelector({
  open,
  onClose,
  endpoints,
  selected,
  endpointTypeById,
  onToggle,
  onSelectAll,
  onDeselectAll,
}: MeterSelectorProps) {
  const allSelected = endpoints.length > 0 && selected.length === endpoints.length;

  return (
    <Drawer anchor="left" open={open} onClose={onClose}>
      <Box sx={{ width: 280, display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Meters
          </Typography>
          <Button size="small" onClick={onClose} sx={{ minWidth: 0 }}>
            ✕
          </Button>
        </Box>

        <Divider />

        <Box sx={{ px: 2, py: 1 }}>
          <Button
            size="small"
            onClick={allSelected ? onDeselectAll : onSelectAll}
          >
            {allSelected ? 'Deselect all' : 'Select all'}
          </Button>
        </Box>

        <Divider />

        <List dense sx={{ flex: 1, overflowY: 'auto' }}>
          {endpoints.map((id) => {
            const checked = selected.includes(id);
            return (
              <ListItem key={id} disablePadding>
                <ListItemButton onClick={() => onToggle(id)}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <Checkbox
                      edge="start"
                      checked={checked}
                      tabIndex={-1}
                      disableRipple
                      size="small"
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={meterLabel(id, endpointTypeById[id])}
                    slotProps={{ primary: { variant: 'body2' } }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
          {endpoints.length === 0 && (
            <ListItem>
              <ListItemText
                primary="No meters found"
                slotProps={{ primary: { variant: 'body2', color: 'text.secondary' } }}
              />
            </ListItem>
          )}
        </List>
      </Box>
    </Drawer>
  );
}
