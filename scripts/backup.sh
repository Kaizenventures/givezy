#!/bin/sh
# Nightly backup of the database and uploaded photos.
#
# Everything the business has — every booking, every giver's name, phone and
# home address, every photo — lives in two Docker volumes on one droplet. This
# takes a consistent copy of both and keeps a rolling window.
#
# Run by cron; see DEPLOY.md for the restore procedure.
set -eu

BACKUP_DIR=${BACKUP_DIR:-/root/backups}
KEEP_DAYS=${KEEP_DAYS:-14}
STAMP=$(date +%F-%H%M)

DATA_VOL=$(docker volume inspect givezy_app-data --format '{{ .Mountpoint }}')
UPLOAD_VOL=$(docker volume inspect givezy_app-uploads --format '{{ .Mountpoint }}')

mkdir -p "$BACKUP_DIR"

# sqlite3 .backup takes a consistent snapshot while the app is still writing.
# Copying the file directly would risk catching it mid-transaction and losing
# whatever is sitting in the write-ahead log.
sqlite3 "$DATA_VOL/givezy.db" ".backup '$BACKUP_DIR/db-$STAMP.db'"
gzip -f "$BACKUP_DIR/db-$STAMP.db"

# Photos are large (74 MB and growing) and rarely change, so keep one mirror
# rather than a dated archive per night. Fourteen copies would fill this disk.
rsync -a --delete "$UPLOAD_VOL/" "$BACKUP_DIR/uploads-current/"

# Optional off-box copy. Local backups protect against a bad migration or a
# corrupted database; they do not protect against losing the droplet itself.
# Set BACKUP_REMOTE to an rclone target (e.g. spaces:givezy-backups) to fix that.
if [ -n "${BACKUP_REMOTE:-}" ] && command -v rclone >/dev/null 2>&1; then
  rclone copy "$BACKUP_DIR/db-$STAMP.db.gz" "$BACKUP_REMOTE" --quiet || echo "warn: off-box copy of the database failed"
  rclone sync "$BACKUP_DIR/uploads-current" "$BACKUP_REMOTE/uploads" --quiet || echo "warn: off-box copy of uploads failed"
fi

find "$BACKUP_DIR" -name 'db-*.db.gz' -mtime "+$KEEP_DAYS" -delete

echo "$(date '+%F %T') backed up db-$STAMP.db.gz and mirrored $(find "$BACKUP_DIR/uploads-current" -type f | wc -l) photos"
