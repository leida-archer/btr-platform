import { useState, useMemo } from "react";
import { ChevronRight, ChevronDown, Folder as FolderIcon, FolderOpen, Plus, MoreVertical, Inbox } from "lucide-react";
import type { Folder } from "../types/data";

export interface FolderTreeProps {
  folders: Folder[];
  currentFolderId: string | null;
  onSelect: (id: string | null) => void;
  /** DnD: called when asset ids are dropped onto a folder (or null for root). */
  onDropAssets?: (folderId: string | null, assetIds: string[]) => void;
  /** DnD: called when a folder is dropped onto another folder (reparent). Receives (dragged, newParent). */
  onDropFolder?: (folderId: string, newParentId: string | null) => void;
  /** Enables writing actions (new/rename/delete, folder drag). */
  editable?: boolean;
  onCreate?: (parentId: string | null, name: string) => void;
  onRename?: (id: string, name: string) => void;
  onDelete?: (id: string) => void;
  /** Total asset count for "All Assets" header. */
  totalCount?: number;
  /** Per-folder asset counts (optional). */
  counts?: Record<string, number>;
  /** Root label override. */
  rootLabel?: string;
}

interface TreeNode extends Folder {
  children: TreeNode[];
}

function buildTree(folders: Folder[]): TreeNode[] {
  const byParent = new Map<string | null, Folder[]>();
  for (const f of folders) {
    const k = f.parentId ?? null;
    if (!byParent.has(k)) byParent.set(k, []);
    byParent.get(k)!.push(f);
  }
  function make(parentId: string | null): TreeNode[] {
    return (byParent.get(parentId) ?? [])
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((f) => ({ ...f, children: make(f.id) }));
  }
  return make(null);
}

/** Return the set of a folder's descendants (inclusive). */
function descendantIds(folders: Folder[], rootId: string): Set<string> {
  const set = new Set<string>([rootId]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const f of folders) {
      if (f.parentId && set.has(f.parentId) && !set.has(f.id)) {
        set.add(f.id);
        changed = true;
      }
    }
  }
  return set;
}

export default function FolderTree({
  folders, currentFolderId, onSelect, onDropAssets, onDropFolder,
  editable = false, onCreate, onRename, onDelete,
  totalCount, counts, rootLabel = "All Assets",
}: FolderTreeProps) {
  const tree = useMemo(() => buildTree(folders), [folders]);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(folders.map((f) => f.id)));
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<string | "__root__" | null>(null);

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDragOver = (e: React.DragEvent, targetId: string | null, isSelfOrDescendant: boolean) => {
    if (isSelfOrDescendant) return;
    // Only accept if drag has our custom data
    const types = e.dataTransfer.types;
    if (types.includes("application/x-btr-assets") || types.includes("application/x-btr-folder")) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      setDropTarget(targetId ?? "__root__");
    }
  };

  const handleDrop = (e: React.DragEvent, targetId: string | null) => {
    e.preventDefault();
    setDropTarget(null);
    const assetsData = e.dataTransfer.getData("application/x-btr-assets");
    const folderData = e.dataTransfer.getData("application/x-btr-folder");
    if (assetsData && onDropAssets) {
      try {
        const ids = JSON.parse(assetsData) as string[];
        if (ids.length) onDropAssets(targetId, ids);
      } catch {/* ignore */}
    } else if (folderData && onDropFolder && editable) {
      // Prevent reparenting into self/descendant
      const descendants = descendantIds(folders, folderData);
      if (!targetId || !descendants.has(targetId)) {
        onDropFolder(folderData, targetId);
      }
    }
  };

  const handleCreate = (parentId: string | null) => {
    setMenuFor(null);
    const name = window.prompt("Folder name:");
    if (name && name.trim() && onCreate) onCreate(parentId, name.trim());
  };

  const handleRename = (f: Folder) => {
    setMenuFor(null);
    const name = window.prompt("Rename folder:", f.name);
    if (name && name.trim() && onRename) onRename(f.id, name.trim());
  };

  const handleDelete = (f: Folder) => {
    setMenuFor(null);
    if (window.confirm(`Delete folder "${f.name}"? Nested folders will also be deleted; assets will be moved to All Assets.`)) {
      onDelete?.(f.id);
    }
  };

  const renderNode = (node: TreeNode, depth: number, draggedIsAncestor = false) => {
    const isCurrent = currentFolderId === node.id;
    const hasChildren = node.children.length > 0;
    const isExpanded = expanded.has(node.id);
    const isDropTarget = dropTarget === node.id;
    const count = counts?.[node.id];

    return (
      <div key={node.id}>
        <div
          draggable={editable}
          onDragStart={(e) => {
            e.dataTransfer.setData("application/x-btr-folder", node.id);
            e.dataTransfer.effectAllowed = "move";
          }}
          onDragOver={(e) => handleDragOver(e, node.id, draggedIsAncestor)}
          onDragLeave={() => { if (dropTarget === node.id) setDropTarget(null); }}
          onDrop={(e) => handleDrop(e, node.id)}
          onClick={() => onSelect(node.id)}
          className={`group flex items-center gap-1 pr-2 py-1.5 rounded-lg cursor-pointer transition-colors ${
            isCurrent ? "bg-magenta/15 text-magenta" : "text-foreground-muted hover:text-foreground hover:bg-ink/30"
          } ${isDropTarget ? "ring-1 ring-magenta bg-magenta/10" : ""}`}
          style={{ paddingLeft: `${depth * 12 + 4}px` }}
        >
          {hasChildren ? (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); toggle(node.id); }}
              className="shrink-0 w-4 h-4 flex items-center justify-center hover:text-foreground"
            >
              {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </button>
          ) : (
            <span className="shrink-0 w-4 h-4" />
          )}
          {isExpanded && hasChildren ? <FolderOpen className="w-3.5 h-3.5 shrink-0" /> : <FolderIcon className="w-3.5 h-3.5 shrink-0" />}
          <span className="flex-1 text-xs font-medium truncate">{node.name}</span>
          {count !== undefined && count > 0 && (
            <span className="text-[10px] text-foreground-muted shrink-0">{count}</span>
          )}
          {editable && (
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setMenuFor(menuFor === node.id ? null : node.id); }}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:text-foreground"
              >
                <MoreVertical className="w-3 h-3" />
              </button>
              {menuFor === node.id && (
                <>
                  <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setMenuFor(null); }} />
                  <div className="absolute right-0 top-5 z-50 bg-surface border border-border rounded-lg shadow-lg py-1 min-w-[140px]">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleCreate(node.id); }}
                      className="w-full text-left px-3 py-1.5 text-xs text-foreground hover:bg-ink/30"
                    >
                      New subfolder
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleRename(node); }}
                      className="w-full text-left px-3 py-1.5 text-xs text-foreground hover:bg-ink/30"
                    >
                      Rename
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleDelete(node); }}
                      className="w-full text-left px-3 py-1.5 text-xs text-coral hover:bg-ink/30"
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
        {isExpanded && hasChildren && (
          <div>
            {node.children.map((child) => renderNode(child, depth + 1, draggedIsAncestor))}
          </div>
        )}
      </div>
    );
  };

  const rootIsDrop = dropTarget === "__root__";

  return (
    <div className="flex flex-col gap-0.5 text-foreground">
      <div
        onDragOver={(e) => handleDragOver(e, null, false)}
        onDragLeave={() => { if (dropTarget === "__root__") setDropTarget(null); }}
        onDrop={(e) => handleDrop(e, null)}
        onClick={() => onSelect(null)}
        className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors ${
          currentFolderId === null ? "bg-magenta/15 text-magenta" : "text-foreground-muted hover:text-foreground hover:bg-ink/30"
        } ${rootIsDrop ? "ring-1 ring-magenta bg-magenta/10" : ""}`}
      >
        <Inbox className="w-3.5 h-3.5 shrink-0" />
        <span className="flex-1 text-xs font-semibold truncate">{rootLabel}</span>
        {totalCount !== undefined && (
          <span className="text-[10px] text-foreground-muted shrink-0">{totalCount}</span>
        )}
        {editable && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); handleCreate(null); }}
            className="shrink-0 p-0.5 hover:text-foreground"
            title="New folder"
          >
            <Plus className="w-3 h-3" />
          </button>
        )}
      </div>
      {tree.map((n) => renderNode(n, 0))}
    </div>
  );
}
