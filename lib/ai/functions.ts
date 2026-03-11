import type { ChatCompletionTool } from 'openai/resources/chat/completions'

/**
 * OpenAI function/tool definitions for the AI receptionist.
 * These define what actions the AI can take during a call.
 */
export const restaurantTools: ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'check_reservation_availability',
      description:
        'Check if a reservation slot is available for a given date, time, and party size. Call this before confirming a booking.',
      parameters: {
        type: 'object',
        properties: {
          date: {
            type: 'string',
            description: 'Date in YYYY-MM-DD format (e.g., "2024-07-20")',
          },
          time: {
            type: 'string',
            description: 'Time in HH:MM 24-hour format (e.g., "19:30")',
          },
          party_size: {
            type: 'number',
            description: 'Number of guests',
          },
        },
        required: ['date', 'time', 'party_size'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_reservation',
      description:
        'Book a table reservation. Only call this after confirming all details with the caller.',
      parameters: {
        type: 'object',
        properties: {
          guest_name: {
            type: 'string',
            description: "Guest's full name",
          },
          guest_phone: {
            type: 'string',
            description: "Guest's phone number (the caller's number is acceptable)",
          },
          date: {
            type: 'string',
            description: 'Date in YYYY-MM-DD format',
          },
          time: {
            type: 'string',
            description: 'Time in HH:MM 24-hour format',
          },
          party_size: {
            type: 'number',
            description: 'Number of guests',
          },
          notes: {
            type: 'string',
            description: 'Any special requests or notes (e.g., "birthday celebration", "window table")',
          },
        },
        required: ['guest_name', 'guest_phone', 'date', 'time', 'party_size'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'cancel_reservation',
      description: "Cancel an existing reservation by the guest's name and phone number.",
      parameters: {
        type: 'object',
        properties: {
          guest_name: {
            type: 'string',
            description: "Guest's full name",
          },
          guest_phone: {
            type: 'string',
            description: "Guest's phone number",
          },
          date: {
            type: 'string',
            description: 'Approximate date of the reservation (YYYY-MM-DD)',
          },
        },
        required: ['guest_name', 'guest_phone'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_menu_info',
      description:
        'Get detailed menu information for a specific category or item. Use when a caller asks about specific dishes, prices, ingredients, or dietary options.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description:
              'What the caller is asking about, e.g., "vegetarian options", "pasta dishes", "starters", "prices"',
          },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'place_order',
      description:
        'Place a food order for pickup or delivery. Only call this after confirming all items, quantities, and delivery/pickup preference with the caller.',
      parameters: {
        type: 'object',
        properties: {
          guest_name: {
            type: 'string',
            description: "Customer's full name",
          },
          guest_phone: {
            type: 'string',
            description: "Customer's phone number",
          },
          order_type: {
            type: 'string',
            enum: ['pickup', 'delivery'],
            description: 'Whether the order is for pickup or delivery',
          },
          items: {
            type: 'array',
            description: 'List of items in the order',
            items: {
              type: 'object',
              properties: {
                item_name: {
                  type: 'string',
                  description: 'Name of the menu item',
                },
                quantity: {
                  type: 'number',
                  description: 'Quantity',
                },
                notes: {
                  type: 'string',
                  description: 'Special instructions for this item (e.g., "no onions")',
                },
              },
              required: ['item_name', 'quantity'],
            },
          },
          delivery_address: {
            type: 'string',
            description: 'Delivery address (required for delivery orders)',
          },
          notes: {
            type: 'string',
            description: 'General order notes',
          },
        },
        required: ['guest_name', 'guest_phone', 'order_type', 'items'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_restaurant_info',
      description:
        "Get specific information about the restaurant such as hours, address, parking, specials, or policies.",
      parameters: {
        type: 'object',
        properties: {
          info_type: {
            type: 'string',
            enum: [
              'hours',
              'address',
              'parking',
              'specials',
              'policies',
              'contact',
              'general',
            ],
            description: 'Type of information requested',
          },
        },
        required: ['info_type'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'transfer_to_human',
      description:
        "Transfer the call to a human staff member. Use when: the caller requests a human, the issue is beyond your capabilities, or there's a complaint that needs a manager.",
      parameters: {
        type: 'object',
        properties: {
          reason: {
            type: 'string',
            description: 'Brief reason for the transfer',
          },
        },
        required: ['reason'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'end_call',
      description:
        'Politely end the call when the caller is done and their needs have been addressed.',
      parameters: {
        type: 'object',
        properties: {
          summary: {
            type: 'string',
            description: 'Brief summary of what was accomplished in this call',
          },
          outcome: {
            type: 'string',
            enum: [
              'booked-reservation',
              'placed-order',
              'answered-query',
              'transferred',
              'no-outcome',
            ],
            description: 'The primary outcome of this call',
          },
        },
        required: ['summary', 'outcome'],
      },
    },
  },
]
