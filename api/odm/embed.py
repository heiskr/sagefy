from odm.field import Field


class Has(Field):
    """
    Allows a document to be embedded within another document directly.
    """

    def __init__(self, Doc, validations=None, default=None, access=True,
                 before_save=None):
        self.value = None
        self.Doc = Doc
        self.validations = validations or ()
        self.default = default
        self.access = access
        self.before_save = before_save

    def get(self):
        if self.value:
            return self.value.to_database()

    def set(self, value):
        self.value = value

    def validate(self, instance, name):
        pass


class HasMany(Has):
    """
    Allows for multiple documents of the same kind to be embedded
    into another document.
    """

    def __init__(self, Doc, validations=None, default=None, access=True,
                 before_save=None):
        self.value = []
        self.Doc = Doc
        self.validations = validations or ()
        self.default = default
        self.access = access
        self.before_save = before_save

    def get(self, index):
        if index:
            return self.value[index].to_database()
        return [d.to_database() for d in self.value]

    def set(self, value):
        self.value = value

    def validate(self, instance, name):
        pass
