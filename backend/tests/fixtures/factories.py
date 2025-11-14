"""
Factory Boy factories for creating test data.
"""
from datetime import datetime

import factory
from factory import fuzzy

from app.models.database import File as FileModel
from app.models.database import Project, User
from app.models.schemas import ColumnInfo, DataSchema


class UserFactory(factory.Factory):
    """Factory for creating User instances."""

    class Meta:
        model = User

    username = factory.Sequence(lambda n: f"user{n}")
    email = factory.LazyAttribute(lambda obj: f"{obj.username}@example.com")
    hashed_password = "hashed_password_placeholder"
    is_active = True
    is_superuser = False
    created_at = factory.LazyFunction(datetime.utcnow)


class ProjectFactory(factory.Factory):
    """Factory for creating Project instances."""

    class Meta:
        model = Project

    name = factory.Sequence(lambda n: f"Project {n}")
    description = factory.Faker("text", max_nb_chars=200)
    user_id = factory.SelfAttribute("user.id") if hasattr(factory, "user") else 1
    is_archived = False
    created_at = factory.LazyFunction(datetime.utcnow)
    updated_at = factory.LazyFunction(datetime.utcnow)


class FileFactory(factory.Factory):
    """Factory for creating File instances."""

    class Meta:
        model = FileModel

    filename = factory.Sequence(lambda n: f"data_file_{n}.csv")
    file_path = factory.LazyAttribute(lambda obj: f"/uploads/{obj.filename}")
    file_size = fuzzy.FuzzyInteger(1000, 10000000)
    row_count = fuzzy.FuzzyInteger(100, 10000)
    column_count = fuzzy.FuzzyInteger(5, 50)
    project_id = factory.SelfAttribute("project.id") if hasattr(factory, "project") else 1
    uploaded_at = factory.LazyFunction(datetime.utcnow)


class ColumnInfoFactory(factory.Factory):
    """Factory for creating ColumnInfo instances."""

    class Meta:
        model = ColumnInfo

    name = factory.Sequence(lambda n: f"column_{n}")
    type = fuzzy.FuzzyChoice(["numeric", "categorical", "datetime"])
    unique_values = fuzzy.FuzzyInteger(1, 1000)
    null_count = fuzzy.FuzzyInteger(0, 100)
    sample_values = factory.LazyFunction(lambda: ["value1", "value2", "value3"])


class DataSchemaFactory(factory.Factory):
    """Factory for creating DataSchema instances."""

    class Meta:
        model = DataSchema

    row_count = fuzzy.FuzzyInteger(100, 10000)
    columns = factory.LazyFunction(
        lambda: [
            ColumnInfo(
                name="id",
                type="numeric",
                unique_values=100,
                null_count=0,
                sample_values=["1", "2", "3"],
            ),
            ColumnInfo(
                name="name",
                type="categorical",
                unique_values=50,
                null_count=5,
                sample_values=["Alice", "Bob", "Charlie"],
            ),
            ColumnInfo(
                name="value",
                type="numeric",
                unique_values=80,
                null_count=2,
                sample_values=["100.5", "200.3", "150.7"],
            ),
        ]
    )
