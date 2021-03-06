from Errors.Errors import RepositoryError

class Repository():
    def __init__(self):
        '''
        Initialize a repository.
        '''
        self.__items = []
        self.__available_id = 0

    def get_available_id(self):
        '''
        Returns:
            int: The first available id.
        '''
        return self.__available_id

    def contains(self, item):
        '''
        Returns:
            bool: Whether the repository contains an item equal to the passed one.
        '''
        for other in self.__items:
            if item == other:
                return True

        return False

    def add(self, item):
        '''
        Add an item to the repository.

        Args:
            item (Item): The item to be added.

        Raises:
            RepositoryError: If an equal item already exists.
        '''
        if self.contains(item):
            raise RepositoryError('Item already exists.')

        self.__available_id = max(self.__available_id, item.get_id()) + 1

        self.__items.append(item)
        return item

    def get(self):
        '''
        Returns:
            list: A copy of the items list.
        '''
        items = self.__items[:]
        return items

    def get_matching(self, *args, **kwargs):
        '''
        Get all the items that match the passed arguments.

        Args:
            Same arguments as Item.matches().

        Returns:
            list: A list of the matching items.
        '''
        matching_items = []

        for item in self.__items:
            if item.matches(*args, **kwargs):
                matching_items.append(item)

        return matching_items

    def get_one_matching(self, *args, **kwargs):
        '''
        Get the first item that matches the passed arguments.

        Args:
            Same arguments as Item.matches().

        Returns:
            Item: The first item that matches the passed arguments.
        '''
        matching_items = self.get_matching(*args, **kwargs)

        if len(matching_items):
            item = matching_items[0]
        else:
            item = None

        return item

    def update(self, item, *args, **kwargs):
        '''
        Update the item using the passed arguments.

        Args:
            item (Item): The item to be updated.
        '''
        item.set_multiple(*args, **kwargs)

    def remove(self, item):
        '''
        Remove the passed item from the repository.

        Args:
            item (Item): The item to be removed.

        Raises:
            RepositoryError: If the item cannot be found in this repository.
        '''
        try:
            self.__items.remove(item)
        except ValueError:
            raise RepositoryError('Repository does not contain this item.')

    def remove_matching(self, *args, **kwargs):
        '''
        Remove all the items that match the passed arguments.

        Args:
            Same arguments as Item.matches().

        Returns:
            list: A list of the removed items.
        '''
        removed_items = self.get_matching(*args, **kwargs)

        for item in removed_items:
            self.remove(item)

        return removed_items
