<script>import Icon from '../Icon.svelte';
const iconNode = [["path", { "d": "m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" }]];
</script>

<Icon name="bookmark" {...$$props} iconNode={iconNode}>
  <slot/>
</Icon>
