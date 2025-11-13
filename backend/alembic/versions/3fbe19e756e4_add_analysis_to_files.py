"""add_analysis_to_files

Revision ID: 3fbe19e756e4
Revises: 9cfb7d62d350
Create Date: 2025-11-11 10:41:11.173133

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3fbe19e756e4'
down_revision: Union[str, Sequence[str], None] = '9cfb7d62d350'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add analysis columns to files table."""
    op.add_column('files', sa.Column('analysis_json', sa.Text(), nullable=True))
    op.add_column('files', sa.Column('analysis_timestamp', sa.DateTime(), nullable=True))
    op.add_column('files', sa.Column('user_intent', sa.Text(), nullable=True))


def downgrade() -> None:
    """Remove analysis columns from files table."""
    op.drop_column('files', 'user_intent')
    op.drop_column('files', 'analysis_timestamp')
    op.drop_column('files', 'analysis_json')
