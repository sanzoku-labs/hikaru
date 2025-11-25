"""add_sheet_support

Revision ID: d405530b1a70
Revises: bb3e5a3d2e96
Create Date: 2025-11-25 10:26:48.560586

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd405530b1a70'
down_revision: Union[str, Sequence[str], None] = 'bb3e5a3d2e96'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema - Add sheet support for Excel files."""
    # Add columns to files table
    op.add_column('files', sa.Column('sheet_name', sa.String(255), nullable=True))
    op.add_column('files', sa.Column('sheet_index', sa.Integer, server_default='0', nullable=True))
    op.add_column('files', sa.Column('available_sheets_json', sa.Text, nullable=True))

    # Add column to file_analyses table
    op.add_column('file_analyses', sa.Column('sheet_name', sa.String(255), nullable=True))


def downgrade() -> None:
    """Downgrade schema - Remove sheet support."""
    # Remove columns from files table
    op.drop_column('files', 'available_sheets_json')
    op.drop_column('files', 'sheet_index')
    op.drop_column('files', 'sheet_name')

    # Remove column from file_analyses table
    op.drop_column('file_analyses', 'sheet_name')
